"""
Scheduler — runs weekly auto-retraining using APScheduler.
Integrated into FastAPI's lifespan via start_scheduler().
"""

from apscheduler.schedulers.background import BackgroundScheduler

_scheduler = None


def _retrain_job():
    """Job function that runs the full retraining pipeline."""
    try:
        from retrain import run_full_retrain

        print("[SCHEDULER] Starting scheduled retraining...")
        run_full_retrain()
        print("[SCHEDULER] Scheduled retraining completed.")
    except Exception as exc:
        print(f"[SCHEDULER ERROR] Retraining failed: {exc}")


def start_scheduler():
    """
    Start the background scheduler.
    Schedule: Every Sunday at 02:00 UTC.
    This ensures the model is retrained weekly with fresh data.
    """
    global _scheduler
    if _scheduler is not None:
        return  # Already running

    _scheduler = BackgroundScheduler()
    _scheduler.add_job(
        _retrain_job,
        trigger="cron",
        day_of_week="sun",
        hour=2,
        minute=0,
        id="weekly_retrain",
        name="Weekly Model Retraining",
        replace_existing=True,
    )
    _scheduler.start()
    print("[SCHEDULER] Background scheduler started — retrain every Sunday at 02:00 UTC")


def stop_scheduler():
    """Gracefully shut down the scheduler."""
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        print("[SCHEDULER] Scheduler stopped.")
