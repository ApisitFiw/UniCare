"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  translateThaiToEn,
  translateEnToThai,
  DICTIONARY,
  REVERSE_DICTIONARY,
} from "@/lib/translationsDictionary";

export type Language = "th" | "en";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (keyOrText: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "th",
  setLang: () => {},
  toggleLang: () => {},
  t: (text) => text,
});

const THAI_CHAR_REGEX = /[\u0E00-\u0E7F]/;
const IGNORED_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE"]);

/**
 * Checks whether a node or any of its ancestors is marked not to be translated.
 * Protects explicit non-translatable tokens or user real names.
 */
function isUserContentNode(node: Node | null): boolean {
  if (!node) return false;
  let curr: HTMLElement | null =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as HTMLElement)
      : (node.parentElement as HTMLElement | null);

  while (curr && curr !== document.documentElement) {
    if (
      curr.getAttribute("data-no-translate") === "true" ||
      curr.getAttribute("translate") === "no" ||
      curr.getAttribute("data-announcement") === "true" ||
      curr.classList?.contains("announcement-content") ||
      curr.classList?.contains("no-translate") ||
      curr.classList?.contains("user-name")
    ) {
      return true;
    }
    curr = curr.parentElement;
  }
  return false;
}

/**
 * Traverses a DOM subtree and translates Thai text to English (or restores original Thai).
 */
export function walkAndTranslate(node: Node, toEnglish: boolean) {
  if (!node) return;
  if (isUserContentNode(node)) return;

  if (node.nodeType === Node.TEXT_NODE) {
    const textNode = node as Text;
    const currentVal = textNode.nodeValue;
    if (!currentVal || !currentVal.trim()) return;

    if (toEnglish) {
      if (THAI_CHAR_REGEX.test(currentVal)) {
        // Save original Thai if not already saved
        if ((textNode as any).__unicare_th === undefined) {
          (textNode as any).__unicare_th = currentVal;
        }
        const translated = translateThaiToEn(currentVal);
        if (translated !== currentVal) {
          textNode.nodeValue = translated;
        }
      }
    } else {
      // Restore original Thai text
      const original = (textNode as any).__unicare_th;
      if (original !== undefined && textNode.nodeValue !== original) {
        textNode.nodeValue = original;
      } else if (original === undefined && textNode.nodeValue && !THAI_CHAR_REGEX.test(textNode.nodeValue)) {
        const thai = translateEnToThai(textNode.nodeValue);
        if (thai !== textNode.nodeValue) {
          textNode.nodeValue = thai;
        }
      }
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    if (IGNORED_TAGS.has(el.tagName)) return;

    // 1. Placeholder attribute
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      if (el.placeholder) {
        if (toEnglish) {
          if (THAI_CHAR_REGEX.test(el.placeholder)) {
            if ((el as any).__unicare_th_ph === undefined) {
              (el as any).__unicare_th_ph = el.placeholder;
            }
            const translated = translateThaiToEn(el.placeholder);
            if (translated !== el.placeholder) {
              el.placeholder = translated;
            }
          }
        } else {
          const original = (el as any).__unicare_th_ph;
          if (original !== undefined && el.placeholder !== original) {
            el.placeholder = original;
          } else if (original === undefined && el.placeholder && !THAI_CHAR_REGEX.test(el.placeholder)) {
            const thai = translateEnToThai(el.placeholder);
            if (thai !== el.placeholder) {
              el.placeholder = thai;
            }
          }
        }
      }
    }

    // 2. Title attribute
    if (el.title) {
      if (toEnglish) {
        if (THAI_CHAR_REGEX.test(el.title)) {
          if ((el as any).__unicare_th_title === undefined) {
            (el as any).__unicare_th_title = el.title;
          }
          const translated = translateThaiToEn(el.title);
          if (translated !== el.title) {
            el.title = translated;
          }
        }
      } else {
        const original = (el as any).__unicare_th_title;
        if (original !== undefined && el.title !== original) {
          el.title = original;
        } else if (original === undefined && el.title && !THAI_CHAR_REGEX.test(el.title)) {
          const thai = translateEnToThai(el.title);
          if (thai !== el.title) {
            el.title = thai;
          }
        }
      }
    }

    // 3. aria-label attribute
    const ariaLabel = el.getAttribute("aria-label");
    if (ariaLabel) {
      if (toEnglish) {
        if (THAI_CHAR_REGEX.test(ariaLabel)) {
          if ((el as any).__unicare_th_aria === undefined) {
            (el as any).__unicare_th_aria = ariaLabel;
          }
          const translated = translateThaiToEn(ariaLabel);
          if (translated !== ariaLabel) {
            el.setAttribute("aria-label", translated);
          }
        }
      } else {
        const original = (el as any).__unicare_th_aria;
        if (original !== undefined && ariaLabel !== original) {
          el.setAttribute("aria-label", original);
        } else if (original === undefined && ariaLabel && !THAI_CHAR_REGEX.test(ariaLabel)) {
          const thai = translateEnToThai(ariaLabel);
          if (thai !== ariaLabel) {
            el.setAttribute("aria-label", thai);
          }
        }
      }
    }

    // Recurse child nodes
    let child = el.firstChild;
    while (child) {
      walkAndTranslate(child, toEnglish);
      child = child.nextSibling;
    }
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("th");
  const isTranslatingRef = useRef(false);
  const observerRef = useRef<MutationObserver | null>(null);

  // Synchronize language from localStorage on client mount
  useEffect(() => {
    const saved = localStorage.getItem("unicare_lang");
    if (saved === "en" || saved === "th") {
      setLangState(saved);
      document.documentElement.lang = saved;
    }

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<Language>;
      if (
        customEvent.detail &&
        (customEvent.detail === "en" || customEvent.detail === "th")
      ) {
        setLangState(customEvent.detail);
      } else {
        const stored = localStorage.getItem("unicare_lang");
        if (stored === "en" || stored === "th") {
          setLangState(stored);
        }
      }
    };

    window.addEventListener("unicare-lang-changed", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("unicare-lang-changed", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Global DOM auto-translation and MutationObserver effect
  useEffect(() => {
    if (typeof document === "undefined" || !document.body) return;

    const toEnglish = lang === "en";

    // 1. Initial full body translation pass
    const runFullPass = () => {
      if (isTranslatingRef.current) return;
      isTranslatingRef.current = true;
      try {
        walkAndTranslate(document.body, toEnglish);
        if (toEnglish && document.title && THAI_CHAR_REGEX.test(document.title)) {
          if ((document as any).__unicare_th_title === undefined) {
            (document as any).__unicare_th_title = document.title;
          }
          const translatedTitle = translateThaiToEn(document.title);
          if (translatedTitle !== document.title) {
            document.title = translatedTitle;
          }
        } else if (!toEnglish && (document as any).__unicare_th_title) {
          document.title = (document as any).__unicare_th_title;
        }
      } finally {
        isTranslatingRef.current = false;
      }
    };

    // Run full pass immediately
    runFullPass();

    // 2. Set up MutationObserver to react to any React re-renders or route changes
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (toEnglish) {
      const observer = new MutationObserver((mutations) => {
        if (isTranslatingRef.current) return;
        isTranslatingRef.current = true;
        try {
          for (const mutation of mutations) {
            if (mutation.type === "childList") {
              mutation.addedNodes.forEach((node) => {
                if (!isUserContentNode(node)) {
                  walkAndTranslate(node, true);
                }
              });
            } else if (mutation.type === "characterData") {
              const target = mutation.target as Text;
              if (isUserContentNode(target)) continue;
              const val = target.nodeValue;
              if (val && THAI_CHAR_REGEX.test(val)) {
                if ((target as any).__unicare_th === undefined) {
                  (target as any).__unicare_th = val;
                }
                const translated = translateThaiToEn(val);
                if (translated !== val) {
                  target.nodeValue = translated;
                }
              }
            }
          }
        } finally {
          isTranslatingRef.current = false;
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      observerRef.current = observer;
    }

    // Run a short delayed pass for asynchronous data fetches (e.g. Supabase, localStorage)
    const timeoutId = setTimeout(runFullPass, 300);

    return () => {
      clearTimeout(timeoutId);
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [lang]);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("unicare_lang", newLang);
    document.documentElement.lang = newLang;
    window.dispatchEvent(
      new CustomEvent("unicare-lang-changed", { detail: newLang })
    );
  }, []);

  const toggleLang = useCallback(() => {
    const nextLang: Language = lang === "th" ? "en" : "th";
    setLang(nextLang);
  }, [lang, setLang]);

  const t = useCallback(
    (keyOrText: string): string => {
      if (!keyOrText) return "";
      if (lang === "en") {
        return translateThaiToEn(keyOrText);
      }
      // If switching back to TH, return original if already Thai
      if (THAI_CHAR_REGEX.test(keyOrText)) {
        return keyOrText;
      }
      return translateEnToThai(keyOrText);
    },
    [lang]
  );

  const value = useMemo(
    () => ({
      lang,
      setLang,
      toggleLang,
      t,
    }),
    [lang, setLang, toggleLang, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
