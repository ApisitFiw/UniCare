-- ==============================================================================
-- UniCare SQL Setup: issue_timelines & issue_comments with RLS Policies & Realtime
-- ==============================================================================

-- 1. สร้างตาราง issue_timelines (ถ้ามีอยู่แล้วจะข้ามไป)
CREATE TABLE IF NOT EXISTS public.issue_timelines (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  issue_id uuid NOT NULL,
  status_text text NOT NULL,
  note text NULL,
  changed_status text NULL,
  changed_by uuid NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT issue_timelines_pkey PRIMARY KEY (id),
  CONSTRAINT issue_timelines_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES profiles (id),
  CONSTRAINT issue_timelines_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES issues (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 2. สร้างตาราง issue_comments (ถ้ามีอยู่แล้วจะข้ามไป)
CREATE TABLE IF NOT EXISTS public.issue_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  issue_id uuid NOT NULL,
  sender_id uuid NULL,
  message text NOT NULL,
  attachment_url text NULL,
  attachment_name text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone ('utc'::text, now()),
  CONSTRAINT issue_comments_pkey PRIMARY KEY (id),
  CONSTRAINT issue_comments_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES issues (id) ON DELETE CASCADE,
  CONSTRAINT issue_comments_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES profiles (id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- 3. ปลดล็อกสิทธิ์ Row-Level Security (RLS) เพื่อให้ระบบสามารถบันทึกข้อมูลและอ่านข้อมูลได้
ALTER TABLE public.issue_timelines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to issue_timelines" ON public.issue_timelines;
CREATE POLICY "Allow all access to issue_timelines"
ON public.issue_timelines
FOR ALL
TO public
USING (true)
WITH CHECK (true);

ALTER TABLE public.issue_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to issue_comments" ON public.issue_comments;
CREATE POLICY "Allow all access to issue_comments"
ON public.issue_comments
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 4. เชื่อมโยงเข้ากับ Supabase Realtime Publication เพื่อให้อัปเดตสถานะและแชทแบบเรียลไทม์ทันที
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'issue_timelines'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.issue_timelines;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'issue_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.issue_comments;
  END IF;
END $$;
