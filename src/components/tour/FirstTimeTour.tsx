import React, { useMemo, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import Joyride, { type Step, type CallBackProps } from "react-joyride";
import {
  getTourCompleted,
  setTourCompleted,
  clearTourCompleted,
  type TourPage,
} from "../../utils/tourStorage";
import colors from "../../constants/colors";

export const TOUR_RESTART_EVENT = "agririse-restart-tour";

/** Call this to restart the tour (e.g. from Settings). Navigate to dashboard first, then use restartTour(). */
export function restartTour(): void {
  clearTourCompleted();
  window.dispatchEvent(new CustomEvent(TOUR_RESTART_EVENT));
}

const TOUR_Z_INDEX = 10000;

function getPageFromPath(pathname: string): TourPage | null {
  if (pathname.startsWith("/home")) return "dashboard";
  if (pathname.startsWith("/allocations")) return "allocations";
  if (pathname.startsWith("/iot/analytics")) return "analytics";
  if (pathname.startsWith("/iot/history")) return "history";
  return null;
}

/**
 * Page-specific first-time tour. On Dashboard only the dashboard tour runs;
 * on Analytics only the analytics tour; on History only the history tour.
 * Restart tour clears all and sends user to dashboard to run the dashboard tour.
 */
export default function FirstTimeTour() {
  const location = useLocation();
  const [run, setRun] = useState(false);

  const page = useMemo(
    () => getPageFromPath(location.pathname),
    [location.pathname]
  );

  const steps: Step[] = useMemo(() => {
    if (!page) return [];

    if (page === "dashboard") {
      return [
        {
          target: "body",
          content: (
            <p style={{ margin: 0 }}>
              This is your <strong>Dashboard</strong>. Here you see an
              overview and live IoT sensor data for your location.
            </p>
          ),
          title: "Dashboard",
          disableBeacon: true,
          placement: "center",
        },
        {
          target: '[data-tour="sidebar"]',
          content:
            "Use the sidebar to switch between Dashboard, Allocations, Analytics, and History.",
          title: "Navigation",
          disableBeacon: true,
          placement: "right",
        },
        {
          target: '[data-tour="header"]',
          content:
            "The header shows the current page. Open your profile (name) here to access Settings and Log out.",
          title: "Header",
          disableBeacon: true,
          placement: "bottom",
        },
        {
          target: '[data-tour="dashboard-overview"]',
          content:
            "Overview shows your location and a short summary of real-time water and climate data.",
          title: "Overview",
          disableBeacon: true,
          placement: "bottom",
        },
        {
          target: '[data-tour="dashboard-iot"]',
          content:
            "The IoT Dashboard displays live sensor readings: water level, humidity, rainfall, and temperature. Use this for a quick snapshot of conditions.",
          title: "IoT Dashboard",
          disableBeacon: true,
          placement: "top",
        },
        {
          target: "body",
          content:
            "Below you’ll see trends and the Optimization section. Go to Analytics or History for detailed data and import/export.",
          title: "You’re set",
          disableBeacon: true,
          placement: "center",
        },
      ];
    }

    if (page === "analytics") {
      return [
        {
          target: "body",
          content: (
            <p style={{ margin: 0 }}>
              This is <strong>Analytics</strong>. View aggregated sensor metrics,
              date ranges, and anomalies for your data.
            </p>
          ),
          title: "Analytics",
          disableBeacon: true,
          placement: "center",
        },
        {
          target: '[data-tour="sidebar"]',
          content:
            "Use the sidebar to switch between Dashboard, Allocations, Analytics, and History.",
          title: "Navigation",
          disableBeacon: true,
          placement: "right",
        },
        {
          target: '[data-tour="analytics-date-range"]',
          content:
            "Choose the date range you want to see. Pick From and To dates, then click Set Dates to load data for that period.",
          title: "Date range",
          disableBeacon: true,
          placement: "bottom",
        },
        {
          target: '[data-tour="import-export-actions"]',
          content: (
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>Import &amp; Export</p>
              <p style={{ margin: "0.35rem 0 0 0" }}>
                <strong>Import</strong> opens a modal to upload CSV or JSON. You’ll see a preview of valid and invalid rows before saving.
              </p>
              <p style={{ margin: "0.35rem 0 0 0" }}>
                <strong>Export</strong> opens a preview where you can download the data as CSV, JSON, or PDF.
              </p>
            </div>
          ),
          title: "Import & Export",
          disableBeacon: true,
          placement: "bottom",
        },
        {
          target: '[data-tour="analytics-content"]',
          content:
            "Here you see aggregated metrics (average, min, max, variability) and any anomalies. The chart below shows the time series for the selected date range.",
          title: "Metrics & chart",
          disableBeacon: true,
          placement: "top",
        },
        {
          target: "body",
          content: (
            <p style={{ margin: 0 }}>
              You're done with the Analytics tour. Use the chart and export options to work with your data.
            </p>
          ),
          title: "Done",
          disableBeacon: true,
          placement: "bottom",
        },
      ];
    }

    if (page === "history") {
      return [
        {
          target: "body",
          content: (
            <p style={{ margin: 0 }}>
              This is <strong>History</strong>. Browse raw sensor readings by date range and export or import data.
            </p>
          ),
          title: "History",
          disableBeacon: true,
          placement: "center",
        },
        {
          target: '[data-tour="sidebar"]',
          content:
            "Use the sidebar to switch between Dashboard, Allocations, Analytics, and History.",
          title: "Navigation",
          disableBeacon: true,
          placement: "right",
        },
        {
          target: '[data-tour="history-date-range"]',
          content:
            "Choose the date range you want to see. Set From and To dates, pick the sensor type and unit, then click Set Dates to load the readings table.",
          title: "Date range",
          disableBeacon: true,
          placement: "bottom",
        },
        {
          target: '[data-tour="import-export-actions"]',
          content: (
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>Import &amp; Export</p>
              <p style={{ margin: "0.35rem 0 0 0" }}>
                <strong>Import</strong> lets you upload CSV or JSON and preview rows before saving for the selected sensor.
              </p>
              <p style={{ margin: "0.35rem 0 0 0" }}>
                <strong>Export</strong> opens a preview with a trend chart and table; download as CSV, JSON, or PDF.
              </p>
            </div>
          ),
          title: "Import & Export",
          disableBeacon: true,
          placement: "bottom",
        },
        {
          target: '[data-tour="history-content"]',
          content:
            "View the table of readings for the selected date range. You can change the display unit and scroll for more data.",
          title: "Readings table",
          disableBeacon: true,
          placement: "top",
        },
        {
          target: "body",
          content: (
            <p style={{ margin: 0 }}>
              You're done with the History tour. Use Import/Export and the table to manage your sensor data.
            </p>
          ),
          title: "Done",
          disableBeacon: true,
          placement: "bottom",
        },
      ];
    }

    if (page === "allocations") {
      return [
        {
          target: "body",
          content: (
            <p style={{ margin: 0 }}>
              This is <strong>Allocations</strong>. Configure and run water allocation optimization, then review and select a solution.
            </p>
          ),
          title: "Allocations",
          disableBeacon: true,
          placement: "center",
        },
        {
          target: '[data-tour="sidebar"]',
          content:
            "Use the sidebar to switch between Dashboard, Allocations, Analytics, and History.",
          title: "Navigation",
          disableBeacon: true,
          placement: "right",
        },
        {
          target: '[data-tour="header"]',
          content: "Open your profile in the header for Settings and Log out.",
          title: "Header",
          disableBeacon: true,
          placement: "bottom",
        },
        {
          target: '[data-tour="allocations-switch"]',
          content: "Switch between <strong>Optimization</strong> (run a new optimization) and <strong>History</strong> (view past selected solutions).",
          title: "Optimization vs History",
          disableBeacon: true,
          placement: "bottom",
        },
        {
          target: '[data-tour="allocations-form"]',
          content:
            "Set your total seasonal water supply (m³) and scenario (dry or wet season), then click Run optimization to start.",
          title: "Configure run",
          disableBeacon: true,
          placement: "right",
        },
        {
          target: '[data-tour="allocations-run"]',
          content:
            "The run monitor shows status (Pending, Completed, or Failed). When completed, you can view and select from the Pareto solutions.",
          title: "Run monitor",
          disableBeacon: true,
          placement: "left",
        },
        {
          target: "body",
          content: (
            <p style={{ margin: 0 }}>
              You’re done with the Allocations tour. Run an optimization and pick a solution that fits your needs.
            </p>
          ),
          title: "Done",
          disableBeacon: true,
          placement: "bottom",
        },
      ];
    }

    return [];
  }, [page]);

  const handleCallback = useCallback(
    (data: CallBackProps) => {
      const { status, type } = data;
      if ((type === "tour:end" || status === "finished") && page) {
        setTourCompleted(page);
        setRun(false);
      }
    },
    [page]
  );

  // Start this page's tour when not yet completed
  React.useEffect(() => {
    if (page === null) return;
    if (getTourCompleted(page)) return;
    const t = setTimeout(() => setRun(true), 500);
    return () => clearTimeout(t);
  }, [location.pathname, page]);

  // Restart: after clear + navigate to dashboard, user lands on /home and dashboard tour runs.
  // If restart event fires while already on dashboard, run the tour.
  React.useEffect(() => {
    const handleRestart = () => {
      clearTourCompleted();
      if (page === "dashboard") setRun(true);
    };
    window.addEventListener(TOUR_RESTART_EVENT, handleRestart);
    return () => window.removeEventListener(TOUR_RESTART_EVENT, handleRestart);
  }, [page]);

  if (page === null || steps.length === 0 || !run) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton={false}
      scrollToFirstStep
      scrollOffset={80}
      callback={handleCallback}
      disableOverlayClose={false}
      spotlightPadding={10}
      styles={{
        options: {
          primaryColor: colors.primary,
          textColor: colors.textHeading,
          backgroundColor: colors.surfaceElevated,
          arrowColor: colors.surfaceElevated,
          overlayColor: "rgba(0, 0, 0, 0.5)",
          zIndex: TOUR_Z_INDEX,
        },
        tooltip: {
          borderRadius: 12,
          padding: "1rem 1.25rem",
          fontFamily: "Poppins-SemiBold, sans-serif",
        },
        tooltipContent: {
          padding: "0.5rem 0 0 0",
          fontFamily: "Poppins-Light, sans-serif",
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
      }}
    />
  );
}
