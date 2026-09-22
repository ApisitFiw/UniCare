-- ==============================================================================
-- Table: ticket_messages (ระบบแชทเรียลไทม์ระหว่าง User และ Admin สำหรับเรื่องที่แจ้ง)
-- ==============================================================================

create table if not exists public.ticket_messages (
    id uuid primary key default gen_random_uuid(),
    report_id text not null,
    sender_role text not null check (sender_role in ('admin', 'user')),
    message text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- สร้าง Index เพื่อเพิ่มความเร็วในการ Query ตาม report_id
create index if not exists idx_ticket_messages_report_id on public.ticket_messages(report_id);
create index if not exists idx_ticket_messages_created_at on public.ticket_messages(created_at);

-- เปิดใช้งาน Row Level Security (RLS)
alter table public.ticket_messages enable row level security;

-- Policy สำหรับให้ทุกคนสามารถอ่านและส่งข้อความได้ (หรือปรับแต่งตาม Auth ในภายหลัง)
do $$ begin
    create policy "Allow read ticket_messages" on public.ticket_messages
        for select using (true);
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create policy "Allow insert ticket_messages" on public.ticket_messages
        for insert with check (true);
exception
    when duplicate_object then null;
end $$;

-- สำคัญมาก: เปิดใช้งาน Realtime สำหรับตาราง ticket_messages ใน Supabase
alter publication supabase_realtime add table public.ticket_messages;
