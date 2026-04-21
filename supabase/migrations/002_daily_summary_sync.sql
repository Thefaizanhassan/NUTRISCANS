-- ==========================================
-- 002_daily_summary_sync.sql
-- Keep daily_summaries in sync with scans and goal updates
-- ==========================================

CREATE OR REPLACE FUNCTION public.recalculate_daily_summary(
  target_user_id UUID,
  target_summary_date DATE
)
RETURNS VOID AS
$$
DECLARE
  totals RECORD;
  profile_goals RECORD;
BEGIN
  SELECT
    COUNT(*)::INTEGER AS scan_count,
    COALESCE(SUM(total_calories), 0) AS total_calories,
    COALESCE(SUM(total_protein), 0) AS total_protein,
    COALESCE(SUM(total_carbs), 0) AS total_carbs,
    COALESCE(SUM(total_fat), 0) AS total_fat,
    COALESCE(SUM(total_fibre), 0) AS total_fibre,
    COALESCE(SUM(total_sugar), 0) AS total_sugar,
    COALESCE(SUM(total_sodium), 0) AS total_sodium
  INTO totals
  FROM public.scans
  WHERE user_id = target_user_id
    AND (timezone('utc', scanned_at))::DATE = target_summary_date;

  IF COALESCE(totals.scan_count, 0) = 0 THEN
    DELETE FROM public.daily_summaries
    WHERE user_id = target_user_id
      AND summary_date = target_summary_date;
    RETURN;
  END IF;

  SELECT
    goal_calories,
    goal_protein,
    goal_carbs,
    goal_fat,
    goal_fibre
  INTO profile_goals
  FROM public.profiles
  WHERE id = target_user_id;

  INSERT INTO public.daily_summaries (
    user_id,
    summary_date,
    total_calories,
    total_protein,
    total_carbs,
    total_fat,
    total_fibre,
    total_sugar,
    total_sodium,
    scan_count,
    goal_calories_pct,
    goal_protein_pct,
    goal_carbs_pct,
    goal_fat_pct,
    goal_fibre_pct
  )
  VALUES (
    target_user_id,
    target_summary_date,
    totals.total_calories,
    totals.total_protein,
    totals.total_carbs,
    totals.total_fat,
    totals.total_fibre,
    totals.total_sugar,
    totals.total_sodium,
    totals.scan_count,
    CASE WHEN COALESCE(profile_goals.goal_calories, 0) > 0 THEN ROUND((totals.total_calories / profile_goals.goal_calories::NUMERIC) * 100, 1) ELSE 0 END,
    CASE WHEN COALESCE(profile_goals.goal_protein, 0) > 0 THEN ROUND((totals.total_protein / profile_goals.goal_protein::NUMERIC) * 100, 1) ELSE 0 END,
    CASE WHEN COALESCE(profile_goals.goal_carbs, 0) > 0 THEN ROUND((totals.total_carbs / profile_goals.goal_carbs::NUMERIC) * 100, 1) ELSE 0 END,
    CASE WHEN COALESCE(profile_goals.goal_fat, 0) > 0 THEN ROUND((totals.total_fat / profile_goals.goal_fat::NUMERIC) * 100, 1) ELSE 0 END,
    CASE WHEN COALESCE(profile_goals.goal_fibre, 0) > 0 THEN ROUND((totals.total_fibre / profile_goals.goal_fibre::NUMERIC) * 100, 1) ELSE 0 END
  )
  ON CONFLICT (user_id, summary_date)
  DO UPDATE SET
    total_calories = EXCLUDED.total_calories,
    total_protein = EXCLUDED.total_protein,
    total_carbs = EXCLUDED.total_carbs,
    total_fat = EXCLUDED.total_fat,
    total_fibre = EXCLUDED.total_fibre,
    total_sugar = EXCLUDED.total_sugar,
    total_sodium = EXCLUDED.total_sodium,
    scan_count = EXCLUDED.scan_count,
    goal_calories_pct = EXCLUDED.goal_calories_pct,
    goal_protein_pct = EXCLUDED.goal_protein_pct,
    goal_carbs_pct = EXCLUDED.goal_carbs_pct,
    goal_fat_pct = EXCLUDED.goal_fat_pct,
    goal_fibre_pct = EXCLUDED.goal_fibre_pct,
    updated_at = now();
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_scan_summary_sync()
RETURNS TRIGGER AS
$$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.recalculate_daily_summary(NEW.user_id, (timezone('utc', NEW.scanned_at))::DATE);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.recalculate_daily_summary(OLD.user_id, (timezone('utc', OLD.scanned_at))::DATE);
    PERFORM public.recalculate_daily_summary(NEW.user_id, (timezone('utc', NEW.scanned_at))::DATE);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_daily_summary(OLD.user_id, (timezone('utc', OLD.scanned_at))::DATE);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

DROP TRIGGER IF EXISTS sync_daily_summaries_from_scans ON public.scans;

CREATE TRIGGER sync_daily_summaries_from_scans
AFTER INSERT OR UPDATE OR DELETE ON public.scans
FOR EACH ROW
EXECUTE FUNCTION public.handle_scan_summary_sync();

CREATE OR REPLACE FUNCTION public.handle_profile_goal_summary_sync()
RETURNS TRIGGER AS
$$
BEGIN
  IF
    OLD.goal_calories IS DISTINCT FROM NEW.goal_calories OR
    OLD.goal_protein IS DISTINCT FROM NEW.goal_protein OR
    OLD.goal_carbs IS DISTINCT FROM NEW.goal_carbs OR
    OLD.goal_fat IS DISTINCT FROM NEW.goal_fat OR
    OLD.goal_fibre IS DISTINCT FROM NEW.goal_fibre
  THEN
    UPDATE public.daily_summaries
    SET
      goal_calories_pct = CASE WHEN COALESCE(NEW.goal_calories, 0) > 0 THEN ROUND((total_calories / NEW.goal_calories::NUMERIC) * 100, 1) ELSE 0 END,
      goal_protein_pct = CASE WHEN COALESCE(NEW.goal_protein, 0) > 0 THEN ROUND((total_protein / NEW.goal_protein::NUMERIC) * 100, 1) ELSE 0 END,
      goal_carbs_pct = CASE WHEN COALESCE(NEW.goal_carbs, 0) > 0 THEN ROUND((total_carbs / NEW.goal_carbs::NUMERIC) * 100, 1) ELSE 0 END,
      goal_fat_pct = CASE WHEN COALESCE(NEW.goal_fat, 0) > 0 THEN ROUND((total_fat / NEW.goal_fat::NUMERIC) * 100, 1) ELSE 0 END,
      goal_fibre_pct = CASE WHEN COALESCE(NEW.goal_fibre, 0) > 0 THEN ROUND((total_fibre / NEW.goal_fibre::NUMERIC) * 100, 1) ELSE 0 END,
      updated_at = now()
    WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

DROP TRIGGER IF EXISTS sync_daily_summaries_from_profile_goals ON public.profiles;

CREATE TRIGGER sync_daily_summaries_from_profile_goals
AFTER UPDATE OF goal_calories, goal_protein, goal_carbs, goal_fat, goal_fibre ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_profile_goal_summary_sync();

DO
$$
DECLARE
  summary_row RECORD;
BEGIN
  FOR summary_row IN
    SELECT DISTINCT
      user_id,
      (timezone('utc', scanned_at))::DATE AS summary_date
    FROM public.scans
  LOOP
    PERFORM public.recalculate_daily_summary(summary_row.user_id, summary_row.summary_date);
  END LOOP;
END;
$$;
