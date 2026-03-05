Icon spec for frontend KPI icons

Files created:

- `reports.svg`
- `report-new.svg`
- `in-review.svg`
- `resolved.svg`
- `users.svg`
- `link.svg`
- `notifications.svg`
- `timer.svg`
- `trending-up.svg`

Common notes
- All icons are monochrome and use `fill="currentColor"` (and lightweight strokes where noted) so they adapt to MUI color styling.
- Recommended default size / viewBox: 24x24 (use `viewBox="0 0 24 24"`).
- Use MUI's `SvgIcon` or an `<img>` with `color` applied via CSS for easy color control.

Specification table

- `reports.svg`:
  - Semantic label: Reports
  - Default color: #1976d2
  - ViewBox/size: 24x24
  - Usage: document + bar-chart icon for overall reports KPI

- `report-new.svg`:
  - Semantic label: New Report
  - Default color: #d81b60
  - ViewBox/size: 24x24
  - Usage: show count of newly submitted reports; includes a small badge

- `in-review.svg`:
  - Semantic label: In Review
  - Default color: #fbc02d
  - ViewBox/size: 24x24
  - Usage: indicates reports currently under review (hourglass/processing metaphor)

- `resolved.svg`:
  - Semantic label: Resolved
  - Default color: #2e7d32
  - ViewBox/size: 24x24
  - Usage: completed/resolved reports (shield + check)

- `users.svg`:
  - Semantic label: Users
  - Default color: #6a1b9a
  - ViewBox/size: 24x24
  - Usage: users count / team KPI

- `link.svg`:
  - Semantic label: Magic Link
  - Default color: #616161
  - ViewBox/size: 24x24
  - Usage: represents a shareable magic link token / public submission link

- `notifications.svg`:
  - Semantic label: Notifications
  - Default color: #f57c00
  - ViewBox/size: 24x24
  - Usage: alerts/unread notifications; pairs well with a small badge overlay

- `timer.svg`:
  - Semantic label: Timer / SLA
  - Default color: #d32f2f
  - ViewBox/size: 24x24
  - Usage: time-to-resolution, SLA indicators

- `trending-up.svg`:
  - Semantic label: Trending Up
  - Default color: #0288d1
  - ViewBox/size: 24x24
  - Usage: positive KPI trend; use in growth/metrics widgets

Usage notes
- To set a default color in MUI, wrap the SVG with `SvgIcon` and set the `htmlColor` prop or use CSS `color`.
- For badges (counts), overlay a small circular element in the corner using absolute positioning; SVGs are designed to leave a clear corner for badge placement.
- Keep icons single-color; for emphasis use `opacity` or small accent circles (handled externally).
