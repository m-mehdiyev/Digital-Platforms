-- Road Map statusları üçün planned_items cədvəlinə yeni sütun
ALTER TABLE planned_items ADD COLUMN IF NOT EXISTS status text 
  DEFAULT 'pending' 
  CHECK (status IN ('pending','in_progress','done','blocked'));

-- Gantt ayları artıq vardı, yoxlamax üçün
ALTER TABLE planned_items ADD COLUMN IF NOT EXISTS start_month int;
ALTER TABLE planned_items ADD COLUMN IF NOT EXISTS end_month int;
ALTER TABLE planned_items ADD COLUMN IF NOT EXISTS is_milestone boolean DEFAULT false;
ALTER TABLE planned_items ADD COLUMN IF NOT EXISTS milestone_label text;

-- published_reports cədvəlinə source_id əlavə et (kopyalama üçün)
ALTER TABLE published_reports ADD COLUMN IF NOT EXISTS copied_from uuid REFERENCES published_reports(id) ON DELETE SET NULL;
