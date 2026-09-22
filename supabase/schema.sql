-- ==============================================================================
-- UniCare - Walailak University Environment & Safety Management System
-- Supabase Schema & Initial Seed Data
-- ==============================================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create Enums
do $$ begin
    create type user_role as enum ('user', 'admin');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type issue_status as enum ('pending', 'in_progress', 'resolved', 'recheck', 'cancelled');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type risk_level as enum ('low', 'medium', 'high', 'very_high');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type priority_level as enum ('low', 'medium', 'high');
exception
    when duplicate_object then null;
end $$;

-- 3. Profiles Table (Linked with Supabase Auth or standalone for dev)
create table if not exists public.profiles (
    id uuid primary key default gen_random_uuid(),
    email text unique,
    full_name text not null,
    role user_role not null default 'user',
    avatar_url text,
    department text default 'มหาวิทยาลัยวลัยลักษณ์',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Categories Table (หมวดหมู่ปัญหา)
create table if not exists public.categories (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    icon text default '📋',
    color text default 'green',
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Risk Areas Table (พื้นที่เสี่ยงสูง & พิกัดแผนที่ มหาวิทยาลัยวลัยลักษณ์)
create table if not exists public.risk_areas (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    frequent_issues text,
    risk_level risk_level not null default 'medium',
    latitude double precision not null default 8.6434,
    longitude double precision not null default 99.8984,
    color text default '#ee9b28',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Issues Table (เรื่องร้องเรียน)
create table if not exists public.issues (
    id uuid primary key default gen_random_uuid(),
    ticket_number text unique not null,
    title text not null,
    description text,
    category_id uuid references public.categories(id) on delete set null,
    risk_area_id uuid references public.risk_areas(id) on delete set null,
    location_detail text,
    status issue_status not null default 'pending',
    priority priority_level not null default 'medium',
    reporter_id uuid references public.profiles(id) on delete set null,
    assigned_to uuid references public.profiles(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Issue Timelines Table (Action Log & ประวัติสถานะ)
create table if not exists public.issue_timelines (
    id uuid primary key default gen_random_uuid(),
    issue_id uuid not null references public.issues(id) on delete cascade,
    action_type text not null default 'STATUS_UPDATE',
    from_status issue_status,
    to_status issue_status,
    note text not null,
    evidence_url text,
    actor_id uuid references public.profiles(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Feedbacks Table (ระบบประเมินความพึงพอใจ CSAT)
create table if not exists public.feedbacks (
    id uuid primary key default gen_random_uuid(),
    issue_id uuid unique not null references public.issues(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete set null,
    overall_rating integer not null check (overall_rating between 1 and 5),
    speed_rating integer check (speed_rating between 1 and 5),
    communication_rating integer check (communication_rating between 1 and 5),
    is_resolved_confirmed boolean not null default true,
    comment text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Issue Comments Table (ระบบแชทซักถามข้อมูลเพิ่มเติม)
create table if not exists public.issue_comments (
    id uuid primary key default gen_random_uuid(),
    issue_id uuid not null references public.issues(id) on delete cascade,
    sender_id uuid references public.profiles(id) on delete set null,
    message text not null,
    attachment_url text,
    attachment_name text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- Row Level Security (RLS)
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.risk_areas enable row level security;
alter table public.issues enable row level security;
alter table public.issue_timelines enable row level security;
alter table public.feedbacks enable row level security;
alter table public.issue_comments enable row level security;

-- Permissive policies for initial development (can be restricted per role later)
create policy "Allow read access to everyone for profiles" on public.profiles for select using (true);
create policy "Allow insert/update for profiles" on public.profiles for all using (true);

create policy "Allow read access to everyone for categories" on public.categories for select using (true);
create policy "Allow write access for categories" on public.categories for all using (true);

create policy "Allow read access to everyone for risk_areas" on public.risk_areas for select using (true);
create policy "Allow write access for risk_areas" on public.risk_areas for all using (true);

create policy "Allow read access to everyone for issues" on public.issues for select using (true);
create policy "Allow write access for issues" on public.issues for all using (true);

create policy "Allow read access to everyone for issue_timelines" on public.issue_timelines for select using (true);
create policy "Allow write access for issue_timelines" on public.issue_timelines for all using (true);

create policy "Allow read access to everyone for feedbacks" on public.feedbacks for select using (true);
create policy "Allow write access for feedbacks" on public.feedbacks for all using (true);

create policy "Allow read access to everyone for issue_comments" on public.issue_comments for select using (true);
create policy "Allow write access for issue_comments" on public.issue_comments for all using (true);

-- Storage bucket for evidence & chat files
insert into storage.buckets (id, name, public) 
values ('issue-attachments', 'issue-attachments', true)
on conflict (id) do nothing;

create policy "Public Access to Issue Attachments" on storage.objects for select using (bucket_id = 'issue-attachments');
create policy "Public Upload to Issue Attachments" on storage.objects for insert with check (bucket_id = 'issue-attachments');

-- ==============================================================================
-- INITIAL SEED DATA (ตรงตามข้อมูลใน Mockup ทุกประการ)
-- ==============================================================================

-- 1. Profiles
insert into public.profiles (id, email, full_name, role, department)
values 
  ('11111111-1111-1111-1111-111111111111', 'admin.nat@wu.ac.th', 'นายนัฐกรณ์ ไพรพฤกษ์', 'admin', 'ฝ่ายอาคารสถานที่และสิ่งแวดล้อม'),
  ('22222222-2222-2222-2222-222222222222', 'admin.apisit@wu.ac.th', 'นายอภิสิทธิ์ วงศ์วิไล', 'admin', 'ฝ่ายสวัสดิการและวินัยนักศึกษา'),
  ('33333333-3333-3333-3333-333333333333', 'user.kittiphum@wu.ac.th', 'กิตติภูมิ ปราชญนคร', 'user', 'สำนักวิชาวิศวกรรมศาสตร์และเทคโนโลยี')
on conflict (id) do nothing;

-- 2. Categories
insert into public.categories (id, name, description, icon, color, is_active)
values 
  ('c0000001-0000-0000-0000-000000000001', 'ขยะ / ของเสีย', 'ขยะทั่วไป ขยะอันตราย ขยะรีไซเคิล', '🗑️', 'red', true),
  ('c0000002-0000-0000-0000-000000000002', 'น้ำ / น้ำเสีย', 'น้ำรั่ว น้ำท่วม น้ำเสีย ระบบระบายน้ำ', '💧', 'blue', true),
  ('c0000003-0000-0000-0000-000000000003', 'อาคาร / บำรุงรักษา', 'อาคารชำรุด ห้องน้ำ ไฟฟ้า แสงสว่าง', '🏛️', 'orange', true),
  ('c0000004-0000-0000-0000-000000000004', 'ต้นไม้ / พื้นที่เขียว', 'ต้นไม้ชำรุด ภูมิทัศน์ พื้นที่สีเขียว', '🌿', 'green', true),
  ('c0000005-0000-0000-0000-000000000005', 'เสียงรบกวน', 'เสียงดัง กิจกรรมรบกวน พื้นที่เรียน/พักอาศัย', '🔊', 'purple', true),
  ('c0000006-0000-0000-0000-000000000006', 'ความปลอดภัย', 'อุบัติเหตุ ความเสี่ยง จุดอับ อาชญากรรม', '🛡️', 'cyan', true),
  ('c0000007-0000-0000-0000-000000000007', 'อื่น ๆ', 'ปัญหาอื่น ๆ ที่ไม่อยู่ในหมวดหมู่อื่น', '⭐', 'yellow', true)
on conflict (id) do nothing;

-- 3. Risk Areas (มหาวิทยาลัยวลัยลักษณ์)
insert into public.risk_areas (id, name, frequent_issues, risk_level, latitude, longitude, color)
values
  ('r0000001-0000-0000-0000-000000000001', 'อาคารเรียนรวม 5', 'เสียงงานก่อสร้าง / ฝุ่นละออง', 'very_high', 8.6448, 99.8978, '#ef476f'),
  ('r0000002-0000-0000-0000-000000000002', 'โรงอาหารกลาง', 'ถังขยะเต็ม / ขยะตกค้าง', 'high', 8.6418, 99.9000, '#ee9b28'),
  ('r0000003-0000-0000-0000-000000000003', 'ลานกิจกรรม', 'เสียงดัง / ความปลอดภัย', 'high', 8.6428, 99.8968, '#ee9b28'),
  ('r0000004-0000-0000-0000-000000000004', 'หอพักนักศึกษาชาย 3', 'เสียงดนตรีเปิดลำโพงยามวิกาล', 'high', 8.6460, 99.9010, '#ef476f'),
  ('r0000005-0000-0000-0000-000000000005', 'หอพักนักศึกษาหญิง 2', 'ท่อระบายน้ำขัดข้อง', 'low', 8.6470, 99.9020, '#52a55c'),
  ('r0000006-0000-0000-0000-000000000006', 'พื้นที่ริมสระน้ำ', 'ความสะอาด / ต้นไม้', 'medium', 8.6410, 99.8950, '#e6b52f')
on conflict (id) do nothing;

-- 4. Issues
insert into public.issues (id, ticket_number, title, description, category_id, risk_area_id, location_detail, status, priority, reporter_id, assigned_to, created_at)
values
  (
    'i0000001-0000-0000-0000-000000000001',
    'ISS-2026-101',
    'เสียงเปิดเพลงและกีตาร์ดังยามวิกาล',
    'เสียงดนตรีเปิดล้ำ 23.00 น. รบกวนเวลาพักผ่อนและอ่านหนังสือสอบ',
    'c0000005-0000-0000-0000-000000000005',
    'r0000004-0000-0000-0000-000000000004',
    'หอพักนักศึกษาชาย 3 (ชั้น 4 ห้อง 412)',
    'in_progress',
    'high',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    now() - interval '2 days'
  ),
  (
    'i0000002-0000-0000-0000-000000000002',
    'ISS-2026-102',
    'ถังขยะล้น ส่งกลิ่นเหม็นและมีแมลงวัน',
    'ถังขยะโรงอาหารกลางเต็มตั้งแต่ช่วงเที่ยง มีขยะเกลื่อนพื้น',
    'c0000001-0000-0000-0000-000000000001',
    'r0000002-0000-0000-0000-000000000002',
    'โรงอาหารกลาง ด้านหลังโซนล้างจาน',
    'resolved',
    'medium',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    now() - interval '4 days'
  ),
  (
    'i0000003-0000-0000-0000-000000000003',
    'ISS-2026-103',
    'ท่อระบายน้ำอุดตัน น้ำระบายไม่ทันเมื่อฝนตก',
    'ท่อระบายน้ำหน้าอาคารเรียนรวม 5 อุดตันจากใบไม้และเศษดิน',
    'c0000002-0000-0000-0000-000000000002',
    'r0000001-0000-0000-0000-000000000001',
    'อาคารเรียนรวม 5 ลานทางเดินด้านทิศเหนือ',
    'pending',
    'medium',
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    now() - interval '1 day'
  )
on conflict (id) do nothing;

-- 5. Issue Timelines (Action Logs)
insert into public.issue_timelines (issue_id, action_type, from_status, to_status, note, actor_id, created_at)
values
  (
    'i0000001-0000-0000-0000-000000000001',
    'REPORT_CREATED',
    null,
    'pending',
    'ผู้ใช้งานแจ้งเรื่องร้องเรียนผ่านระบบ UNICARE',
    '33333333-3333-3333-3333-333333333333',
    now() - interval '2 days'
  ),
  (
    'i0000001-0000-0000-0000-000000000001',
    'STATUS_UPDATE',
    'pending',
    'in_progress',
    'เจ้าหน้าที่เข้าตรวจสอบพื้นที่และประสานงานผู้เกี่ยวข้องเรียบร้อย',
    '11111111-1111-1111-1111-111111111111',
    now() - interval '1 day 22 hours'
  ),
  (
    'i0000002-0000-0000-0000-000000000002',
    'STATUS_UPDATE',
    'in_progress',
    'resolved',
    'ทีมแม่บ้านเข้าเก็บขยะและฉีดล้างพื้นจุดวางถังขยะเรียบร้อย',
    '11111111-1111-1111-1111-111111111111',
    now() - interval '3 days'
  );

-- 6. Feedbacks (CSAT)
insert into public.feedbacks (issue_id, user_id, overall_rating, speed_rating, communication_rating, is_resolved_confirmed, comment, created_at)
values
  (
    'i0000002-0000-0000-0000-000000000002',
    '33333333-3333-3333-3333-333333333333',
    5,
    5,
    5,
    true,
    'รปภ. และทีมแม่บ้านเข้ามาระงับเหตุได้รวดเร็วมากครับ ภายใน 30 นาทีก็เรียบร้อย ขอบคุณครับ',
    now() - interval '3 days'
  );

-- 7. Issue Comments (Clarification Chat)
insert into public.issue_comments (issue_id, sender_id, message, created_at)
values
  (
    'i0000001-0000-0000-0000-000000000001',
    '33333333-3333-3333-3333-333333333333',
    'แนบไฟล์รูปภาพเสียงรบกวนเพิ่มเติมครับ ยังมีเสียงดังอยู่ต่อเนื่อง',
    now() - interval '1 day 23 hours'
  ),
  (
    'i0000001-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'รับทราบครับ เจ้าหน้าที่กำลังเดินทางเข้าไปตรวจตึกหอพักชาย 3 ชั้น 4 ทันทีครับ',
    now() - interval '1 day 22 hours'
  );
