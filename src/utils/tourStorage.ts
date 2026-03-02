const TOUR_PREFIX = "agririse_tour_";

export type TourPage = "dashboard" | "allocations" | "analytics" | "history";

const TOUR_PAGES: TourPage[] = ["dashboard", "allocations", "analytics", "history"];

function getKey(page: TourPage): string {
  return `${TOUR_PREFIX}${page}`;
}

export function getTourCompleted(page: TourPage): boolean {
  try {
    return localStorage.getItem(getKey(page)) === "true";
  } catch {
    return false;
  }
}

export function setTourCompleted(page: TourPage): void {
  try {
    localStorage.setItem(getKey(page), "true");
  } catch {
    // ignore
  }
}

/** Clear completion for all pages (e.g. when user clicks "Restart tour"). */
export function clearTourCompleted(): void {
  try {
    for (const page of TOUR_PAGES) {
      localStorage.removeItem(getKey(page));
    }
  } catch {
    // ignore
  }
}
