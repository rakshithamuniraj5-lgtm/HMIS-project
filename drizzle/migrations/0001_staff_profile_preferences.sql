ALTER TABLE public.profiles ADD COLUMN preferred_language text NOT NULL DEFAULT 'EN';
ALTER TABLE public.profiles ADD COLUMN auto_reminders boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN retry_attempts integer NOT NULL DEFAULT 3;
ALTER TABLE public.profiles ADD COLUMN retry_gap_minutes integer NOT NULL DEFAULT 30;