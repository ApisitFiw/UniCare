-- ==============================================================================
-- UniCare SQL: Update feedbacks table for all 10 user satisfaction questions
-- วิธีใช้งาน:
-- 1. เข้า Supabase Dashboard -> SQL Editor -> New Query
-- 2. วางโค้ด SQL ด้านล่างนี้ทั้งหมดแล้วกด "Run" (หรือ Ctrl+Enter)
-- 3. หากมีตารางอยู่แล้ว ระบบจะเพิ่มคอลัมน์ให้อัตโนมัติโดยข้อมูลเก่าไม่หาย
-- ==============================================================================

-- 1. สร้างตาราง feedbacks หากยังไม่เคยมี
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  issue_id uuid NOT NULL,
  user_id uuid NULL,
  overall_rating integer NOT NULL,
  speed_rating integer NULL,
  timeliness_rating integer NULL,
  communication_rating integer NULL,
  professionalism_rating integer NULL,
  update_status_rating integer NULL,
  clarity_rating integer NULL,
  cleanliness_rating integer NULL,
  resolution_rating integer NULL,
  prevention_rating integer NULL,
  system_satisfaction_rating integer NULL,
  criteria_scores jsonb NULL,
  is_resolved_confirmed boolean NOT NULL DEFAULT true,
  comment text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone ('utc'::text, now()),
  CONSTRAINT feedbacks_pkey PRIMARY KEY (id),
  CONSTRAINT feedbacks_issue_id_key UNIQUE (issue_id),
  CONSTRAINT feedbacks_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE SET NULL,
  CONSTRAINT feedbacks_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES issues (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 2. เพิ่มคอลัมน์ประเมิน 10 มิติในตารางเดิม (กรณีตาราง feedbacks ถูกสร้างไว้ก่อนแล้ว)
ALTER TABLE public.feedbacks
  ADD COLUMN IF NOT EXISTS timeliness_rating integer NULL,
  ADD COLUMN IF NOT EXISTS professionalism_rating integer NULL,
  ADD COLUMN IF NOT EXISTS update_status_rating integer NULL,
  ADD COLUMN IF NOT EXISTS clarity_rating integer NULL,
  ADD COLUMN IF NOT EXISTS cleanliness_rating integer NULL,
  ADD COLUMN IF NOT EXISTS resolution_rating integer NULL,
  ADD COLUMN IF NOT EXISTS prevention_rating integer NULL,
  ADD COLUMN IF NOT EXISTS system_satisfaction_rating integer NULL,
  ADD COLUMN IF NOT EXISTS criteria_scores jsonb NULL;

-- 3. เพิ่ม Check Constraints สำหรับตรวจสอบคะแนน 1 - 5 ดาว
DO $$
BEGIN
  -- timeliness_rating (ข้อ 2)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feedbacks_timeliness_rating_check') THEN
    ALTER TABLE public.feedbacks ADD CONSTRAINT feedbacks_timeliness_rating_check 
      CHECK (timeliness_rating IS NULL OR (timeliness_rating >= 1 AND timeliness_rating <= 5));
  END IF;

  -- professionalism_rating (ข้อ 4)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feedbacks_professionalism_rating_check') THEN
    ALTER TABLE public.feedbacks ADD CONSTRAINT feedbacks_professionalism_rating_check 
      CHECK (professionalism_rating IS NULL OR (professionalism_rating >= 1 AND professionalism_rating <= 5));
  END IF;

  -- update_status_rating (ข้อ 5)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feedbacks_update_status_rating_check') THEN
    ALTER TABLE public.feedbacks ADD CONSTRAINT feedbacks_update_status_rating_check 
      CHECK (update_status_rating IS NULL OR (update_status_rating >= 1 AND update_status_rating <= 5));
  END IF;

  -- clarity_rating (ข้อ 6)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feedbacks_clarity_rating_check') THEN
    ALTER TABLE public.feedbacks ADD CONSTRAINT feedbacks_clarity_rating_check 
      CHECK (clarity_rating IS NULL OR (clarity_rating >= 1 AND clarity_rating <= 5));
  END IF;

  -- cleanliness_rating (ข้อ 7)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feedbacks_cleanliness_rating_check') THEN
    ALTER TABLE public.feedbacks ADD CONSTRAINT feedbacks_cleanliness_rating_check 
      CHECK (cleanliness_rating IS NULL OR (cleanliness_rating >= 1 AND cleanliness_rating <= 5));
  END IF;

  -- resolution_rating (ข้อ 8)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feedbacks_resolution_rating_check') THEN
    ALTER TABLE public.feedbacks ADD CONSTRAINT feedbacks_resolution_rating_check 
      CHECK (resolution_rating IS NULL OR (resolution_rating >= 1 AND resolution_rating <= 5));
  END IF;

  -- prevention_rating (ข้อ 9)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feedbacks_prevention_rating_check') THEN
    ALTER TABLE public.feedbacks ADD CONSTRAINT feedbacks_prevention_rating_check 
      CHECK (prevention_rating IS NULL OR (prevention_rating >= 1 AND prevention_rating <= 5));
  END IF;

  -- system_satisfaction_rating (ข้อ 10)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feedbacks_system_satisfaction_rating_check') THEN
    ALTER TABLE public.feedbacks ADD CONSTRAINT feedbacks_system_satisfaction_rating_check 
      CHECK (system_satisfaction_rating IS NULL OR (system_satisfaction_rating >= 1 AND system_satisfaction_rating <= 5));
  END IF;
END $$;

-- 4. ตั้งค่า Row Level Security (RLS) สำหรับ feedbacks
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to feedbacks" ON public.feedbacks;
CREATE POLICY "Allow all access to feedbacks"
ON public.feedbacks
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 5. เปิด Realtime สำหรับ feedbacks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'feedbacks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.feedbacks;
  END IF;
END $$;
