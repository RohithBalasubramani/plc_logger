love it. here’s a **clean, operator-first UX** for your third tab: **Logging & Scheduler** — same left-rail 1:4 layout, high clarity, zero surprises. (UI/UX + functionality only; no code, no structure, no URLs.)

# Logging & Scheduler — UX & functionality

## Layout & navigation (same 1:4 rhythm)

- **Left rail (1/4 width)**

  1. **Jobs** (create, monitor, control)
  2. **Alarms** (define, arm, acknowledge)
  3. **Buffers & Health** (queues, store-and-forward, system budget)
  4. **History & Reports** (runs, errors, summaries)
  5. **Utilities** (import/export, templates, validation)

- **Main area (3/4 width)** shows the active section’s editor, inspector, or dashboard.
- **Sticky gate banner** (bottom-right): “Ready to run” checks: ≥1 **mapped** table selected in a job, job **Enabled**, and a **Default DB** is OK.

---

## 1) Jobs

### Jobs list (left rail shortcut + main table)

- Columns: **Name**, **Type** (Continuous | Triggered), **Scope** (tables/columns count), **Interval / Trigger**, **Batching**, **CPU budget**, **Status** (Running/Paused/Stopped/Degraded), **Next run**, **Last run**, **Errors** (last 1h).
- Row actions: **Start**, **Pause**, **Stop**, **Dry-Run 60s**, **Backfill once**, **Duplicate**, **Edit**, **Delete**.
- Bulk: start/stop/pause multiple jobs, export selected.

### Create / Edit Job (wizard; compact, no tabs)

**Step 1 — Mode & purpose**

- **Type**: Continuous or Triggered.
- Short explainer:

  - _Continuous_: sample on a fixed interval.
  - _Triggered_: watch a condition (bit flip, threshold, change with deadband, edge) → when true, log a full row (or selected columns).

**Step 2 — Scope (what to log)**

- **Table picker**: lists **mapped** tables only; filter by parent schema, name pattern, status.
- **Column selector**: default = “All mapped columns” with quick exclude/include; search by name/unit/type.
- Option: “Include only columns with per-column poll rates” (for specialized jobs).

**Step 3 — Read policy (how to read)**

- **Interval** (continuous): set in ms/sec/min; show safe range hint based on table size.
- **Subscriptions toggle** (where supported): prefer event/monitored-item reads; fallback to polling.
- **Per-column poll overrides**: show how many selected columns have custom `poll ms`; option to honor/ignore them.
- **Timeouts & retries**: sensible defaults; brief tooltip guidance.
- **Read grouping**: combine addresses where possible; auto-range packing (register-based).
- **Jitter control**: stagger table starts to avoid burst writes.

**Step 4 — Trigger logic (if Triggered)**

- **Trigger source**: pick **device + table + field** (from mapping).
- **Operators**:

  - _Change (deadband)_ → log when |Δ| ≥ deadband (unit-aware).
  - _Rising edge_ / _Falling edge_.
  - _Threshold_: `>`, `>=`, `<`, `<=`, `==`, `!=`.
  - _Windowed peak_ (detect local maxima/minima within a time/window length).
  - _Rate-of-change_ (derivative exceeds threshold).

- **Condition builder**: AND/OR groups across multiple fields; parentheses supported.
- **Hysteresis & hold-off**: prevent flapping; e.g., “remain true for 2s before firing”, “cool-down 10s”.
- **Action**: what to log when true → “Full row” or “Selected columns only”.

**Step 5 — Write policy (how to write)**

- **Target**: shows Default DB (override allowed if multiple targets exist).
- **Batching**: by count and/or by time (e.g., insert every N samples or every T ms).
- **Retention hint**: show current retention (if configured elsewhere); non-blocking.
- **Store-and-forward**: toggle to buffer on disk when DB is offline; shows max size and current usage.
- **Ordering**: guarantee monotonic `timestamp_utc`; discard late/duplicate option.

**Step 6 — Runtime & scheduling**

- **Start behavior**: start on save, start on app launch, or manual.
- **Schedule windows** (optional): run only during selected hours/days; skip/flush behavior outside windows.
- **CPU budget**:

  - Simple **slider**: _Eco_ ↔ _Balanced_ ↔ _Performance_.
  - Advanced **limits**: max parallel device reads, max parallel table jobs, max DB write workers.
  - **Estimator** panel: shows predicted read/write rate and CPU/I/O cost, warns if over-committed.

**Step 7 — Preview & validate**

- **Dry-Run 60s**: reads & simulates writes without persisting; shows throughput, p50/p95 latency, error %, queue depth.
- **Validation checklist**: unmapped fields, offline devices, illegal poll rates, write permissions, time skew.
- **Save** only when all critical checks pass (non-critical warnings allowed with acknowledge).

### Job inspector (main area when a job is selected)

- **Header**: job name, status chip (with reason if Degraded).
- **Live tiles**:

  - **Read rate** (values/s), **Write throughput** (rows/s), **Queue depth**, **Error %**, **p50/p95 latencies** (read & write).
  - Small **heatmap** by table for lag/errors.

- **Controls**: Start, Pause, Stop, Dry-Run, Backfill once (snapshot read now), Flush buffer.
- **Recent events**: chronological log (started, paused, condition fired, backpressure, reconnects).
- **Scope summary**: which tables/columns are in scope, with a quick link to mapping if something’s invalid.

### Collision & priority (when multiple jobs touch the same target)

- **Policy chooser** per table:

  - “Last writer wins”,
  - “Serialize jobs” (queue by priority),
  - “Skip if already written in last X ms”.

- **Job priority**: low/normal/high. Display conflict warnings inline.

---

## 2) Alarms

### Alarms list

- Columns: **Name**, **Severity** (Info/Warning/Alarm/Critical), **Scope** (table/fields), **Condition**, **Action** (log only | log+notify), **Status** (Armed/Disarmed), **Active now**, **Last fired**.
- Row actions: **Arm/Disarm**, **Acknowledge**, **Edit**, **Duplicate**, **Delete**.

### Create / Edit Alarm (builder)

**Definition**

- **Name** & **Severity** color.
- **Scope**: choose mapped table(s); select one or more **fields** as operands.
- **Condition types** (same palette as Triggered jobs, plus alarm-specifics):

  - Threshold, change with deadband, rising/falling edge, windowed peak, rate-of-change.
  - **Compound expressions** (AND/OR groups).

- **Hysteresis**: on-delay, off-delay; **Latch** (remains active until acknowledged, even if condition clears).
- **Dedup window**: ignore repeats within T seconds.

**Actions**

- **Log alarm event** (always available; writes to alarms table with `timestamp_utc`, value, severity, message).
- **Auto-snapshot**: optional one-time full-row capture when alarm fires.
- **Notify** (local): in-app banner, system toast.
- **Escalation** (optional): if not acknowledged within T, raise severity or trigger a secondary action.

**Run behavior**

- **Armed/Disarmed** toggle.
- **Maintenance mode** (suppress actions but keep counters).
- **Test fire** button to verify UX and downstream logging.

### Alarm monitor (main area)

- **Active alarms** panel (sticky): count by severity; quick **Acknowledge All** (confirm).
- **Timeline** of events with filters (severity, table, field, acknowledged/unacknowledged).
- **Details drawer**: shows condition, last N values around the event, who acknowledged, any notes.
- **Flap detector**: marks alarms that bounced frequently; suggests increasing hysteresis.

---

## 3) Buffers & Health

### Buffers

- **Store-and-forward** meter: used vs. limit, estimated time to saturation at current rate.
- **Per-job queues**: bars for backlog; click to see last write error.
- **Eviction policy** (read-only hint): how the system drops or prioritizes when full.

### System health

- **Device connectivity**: green/amber/red by device, with reconnect counters.
- **Database health**: write success %, server time skew badge, last failure reason.
- **CPU & I/O budget**: gauges vs. set limits; quick nudge to lower/raise.
- **Safe shutdown**: “Drain and stop all jobs” button with progress.

---

## 4) History & Reports

- **Runs**: per-job run history (start/stop times, duration, totals logged, average latencies, errors).
- **Failures**: top error types with counts; link to the exact job/table.
- **Throughput summary**: day/hour charts (values/s, rows/s).
- **Alarm summary**: counts by severity, mean time to acknowledge, top noisy signals.

---

## 5) Utilities

- **Import/Export**: jobs, alarms, or entire logging configuration bundle.
- **Templates**: save a job/alarms as reusable templates (e.g., “1 Hz baseline”, “Voltage peak catcher”).
- **Validation center**: one-click audit for: unmapped fields, offline devices, DB offline, illegal intervals, overlapping jobs, missing permissions.

---

## Micro-interactions & safeguards

- **Live “What will happen” chips**: as you adjust interval/batching, a chip updates predicted rows/sec and storage/day.
- **Inline warnings**: “Selected interval may exceed device capability” (based on recent latency), “Per-column poll overrides will increase load by \~X%”.
- **Acknowledge notes**: when acknowledging an alarm, prompt for a short note (optional).
- **Keyboard**: start/stop job via shortcut, quick search in lists with `/`.
- **Accessibility**: severity always paired with a word, not just color.

---

## Acceptance checks (for this tab)

1. **Job creation**

   - Continuous job: selects mapped tables, sets interval, batching, CPU budget; passes validation; Dry-Run shows non-zero throughput; Start → status Running.
   - Triggered job: defines condition with deadband or edge; fires during test; logs full rows or selected columns as configured.

2. **Controls**

   - Start/Pause/Stop work instantly and reflect in metrics; Backfill once captures a snapshot row.
   - Collision policy prevents double-writes or coordinates jobs deterministically.

3. **Alarms**

   - Define an alarm with hysteresis and latch; arm it; when condition met, an event is logged and visible; acknowledge clears active state; timeline records it.

4. **Resilience**

   - If device goes offline → job shows **Degraded**, buffers accumulate (if enabled), auto-reconnect succeeds later, buffered data flushes.
   - If DB goes offline → buffers grow to limit, warning appears; on recovery, backlog drains; no UI freezes.

5. **Health & history**

   - Buffers & Health shows realistic queue depths and time-to-full; History lists runs and errors with correct counts.

---

## Small, high-impact additions

- **Quiet hours**: suppress alarms (or demote to log-only) during defined windows.
- **Per-table throttles**: minimum separation between writes for the same table to reduce churn.
- **Derived fields (preview-only)**: simple expressions (e.g., phase average) for triggers/alarms without altering schemas.
- **Capacity guardrails**: soft caps prevent setting intervals below a safe minimum given current CPU budget.

---

This gives you a **coherent, testable** Logging & Scheduler UX: create jobs with confidence, watch them in real time, handle backpressure safely, and get actionable alarms without noise. Tell me what you want emphasized or simplified, and I’ll refine—and I’ll stick to UI/UX + functionality only.
