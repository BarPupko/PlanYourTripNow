import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_KEY = "ivri_admin_tour_seen";
const CREATE_TRIP_TOUR_KEY = "ivri_create_trip_tour_seen";
const EDIT_TRIP_TOUR_KEY = "ivri_edit_trip_tour_seen";

export function hasSeenTour() {
  return localStorage.getItem(TOUR_KEY) === "true";
}

export function markTourSeen() {
  localStorage.setItem(TOUR_KEY, "true");
}

export function hasSeenCreateTripTour() {
  return localStorage.getItem(CREATE_TRIP_TOUR_KEY) === "true";
}

export function hasSeenEditTripTour() {
  return localStorage.getItem(EDIT_TRIP_TOUR_KEY) === "true";
}

export function startTour(t) {
  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayOpacity: 0.6,
    onDestroyed: markTourSeen,
    steps: [
      {
        popover: {
          title: t.tourWelcomeTitle,
          description: t.tourWelcomeDesc,
        },
      },
      {
        element: "#tour-create-trip",
        popover: {
          title: t.tourCreateTripTitle,
          description: t.tourCreateTripDesc,
          side: "bottom",
          align: "end",
        },
      },
      {
        element: "#tour-view-filters",
        popover: {
          title: t.tourViewFiltersTitle,
          description: t.tourViewFiltersDesc,
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#tour-status-filters",
        popover: {
          title: t.tourStatusFiltersTitle,
          description: t.tourStatusFiltersDesc,
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#tour-trip-list",
        popover: {
          title: t.tourTripListTitle,
          description: t.tourTripListDesc,
          side: "top",
          align: "start",
        },
      },
      {
        element: "#tour-calendar",
        popover: {
          title: t.tourCalendarTitle,
          description: t.tourCalendarDesc,
          side: "left",
          align: "start",
        },
      },
      {
        element: "#tour-gift-cards",
        popover: {
          title: t.tourGiftCardsTitle,
          description: t.tourGiftCardsDesc,
          side: "bottom",
          align: "end",
        },
      },
      {
        element: "#tour-help-btn",
        popover: {
          title: t.tourHelpBtnTitle,
          description: t.tourHelpBtnDesc,
          side: "bottom",
          align: "end",
        },
      },
    ],
  });

  driverObj.drive();
}

export function startCreateTripTour(t) {
  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayOpacity: 0.5,
    onDestroyed: () => localStorage.setItem(CREATE_TRIP_TOUR_KEY, "true"),
    steps: [
      {
        popover: {
          title: t.createTourWelcomeTitle,
          description: t.createTourWelcomeDesc,
        },
      },
      {
        element: "#create-tour-basic",
        popover: {
          title: t.createTourBasicTitle,
          description: t.createTourBasicDesc,
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#create-tour-driver",
        popover: {
          title: t.createTourDriverTitle,
          description: t.createTourDriverDesc,
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#create-tour-pickup",
        popover: {
          title: t.createTourPickupTitle,
          description: t.createTourPickupDesc,
          side: "top",
          align: "start",
        },
      },
      {
        element: "#create-tour-pricing",
        popover: {
          title: t.createTourPricingTitle,
          description: t.createTourPricingDesc,
          side: "top",
          align: "start",
        },
      },
      {
        element: "#create-tour-website",
        popover: {
          title: t.createTourWebsiteTitle,
          description: t.createTourWebsiteDesc,
          side: "top",
          align: "start",
        },
      },
      {
        element: "#create-tour-submit",
        popover: {
          title: t.createTourSubmitTitle,
          description: t.createTourSubmitDesc,
          side: "top",
          align: "end",
        },
      },
    ],
  });

  driverObj.drive();
}

export function startEditTripTour(t) {
  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayOpacity: 0.5,
    onDestroyed: () => localStorage.setItem(EDIT_TRIP_TOUR_KEY, "true"),
    steps: [
      {
        popover: {
          title: t.editTourWelcomeTitle,
          description: t.editTourWelcomeDesc,
        },
      },
      {
        element: "#edit-tour-dates",
        popover: {
          title: t.editTourDatesTitle,
          description: t.editTourDatesDesc,
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#edit-tour-right-col",
        popover: {
          title: t.editTourRightColTitle,
          description: t.editTourRightColDesc,
          side: "left",
          align: "start",
        },
      },
      {
        element: "#edit-tour-custom-info",
        popover: {
          title: t.editTourCustomInfoTitle,
          description: t.editTourCustomInfoDesc,
          side: "top",
          align: "start",
        },
      },
      {
        element: "#edit-tour-itinerary",
        popover: {
          title: t.editTourItineraryTitle,
          description: t.editTourItineraryDesc,
          side: "top",
          align: "start",
        },
      },
      {
        element: "#edit-tour-submit",
        popover: {
          title: t.editTourSubmitTitle,
          description: t.editTourSubmitDesc,
          side: "top",
          align: "end",
        },
      },
    ],
  });

  driverObj.drive();
}
