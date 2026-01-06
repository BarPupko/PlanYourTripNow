// Vehicle layout configurations
// Each seat has: id, x, y positions for SVG rendering

export const vehicleLayouts = {
  sprinter_15: {
    name: 'Mercedes Sprinter Black (14 Seats)',
    totalSeats: 14,
    hasDriverName: true,
    seats: [
      // Front row - 1 passenger seat next to driver
      { id: 1, row: 1, position: 'right', x: 250, y: 50 },

      // Row 2 - Bench (3 seats)
      { id: 2, row: 2, position: 'left', x: 60, y: 140 },
      { id: 3, row: 2, position: 'center', x: 165, y: 140 },
      { id: 4, row: 2, position: 'right', x: 270, y: 140 },

      // Row 3 - Bench (3 seats)
      { id: 5, row: 3, position: 'left', x: 60, y: 230 },
      { id: 6, row: 3, position: 'center', x: 165, y: 230 },
      { id: 7, row: 3, position: 'right', x: 270, y: 230 },

      // Row 4 - Bench (3 seats)
      { id: 8, row: 4, position: 'left', x: 60, y: 320 },
      { id: 9, row: 4, position: 'center', x: 165, y: 320 },
      { id: 10, row: 4, position: 'right', x: 270, y: 320 },

      // Row 5 - Back bench (4 seats)
      { id: 11, row: 5, position: 'left', x: 40, y: 410 },
      { id: 12, row: 5, position: 'center-left', x: 130, y: 410 },
      { id: 13, row: 5, position: 'center-right', x: 220, y: 410 },
      { id: 14, row: 5, position: 'right', x: 310, y: 410 }
    ]
  },

  bus_30: {
    name: 'Mercedes Sprinter White (11 Seats)',
    totalSeats: 11,
    hasDriverName: true,
    seats: [
      // Front row - 1 passenger seat next to driver
      { id: 1, row: 1, position: 'right', x: 250, y: 50 },

      // Row 2 - Bench (3 seats)
      { id: 2, row: 2, position: 'left', x: 60, y: 140 },
      { id: 3, row: 2, position: 'center', x: 165, y: 140 },
      { id: 4, row: 2, position: 'right', x: 270, y: 140 },

      // Row 3 - Bench (3 seats)
      { id: 5, row: 3, position: 'left', x: 60, y: 230 },
      { id: 6, row: 3, position: 'center', x: 165, y: 230 },
      { id: 7, row: 3, position: 'right', x: 270, y: 230 },

      // Row 4 - Back bench (4 seats)
      { id: 8, row: 4, position: 'left', x: 40, y: 320 },
      { id: 9, row: 4, position: 'center-left', x: 130, y: 320 },
      { id: 10, row: 4, position: 'center-right', x: 220, y: 320 },
      { id: 11, row: 4, position: 'right', x: 310, y: 320 }
    ]
  },

  highlander_7: {
    name: 'Toyota Highlander (7 Seats)',
    totalSeats: 7,
    hasDriverName: true,
    seats: [
      // Front row - 1 passenger seat next to driver
      { id: 1, row: 1, position: 'right', x: 250, y: 50 },

      // Row 2 - Bench (3 seats)
      { id: 2, row: 2, position: 'left', x: 60, y: 180 },
      { id: 3, row: 2, position: 'center', x: 165, y: 180 },
      { id: 4, row: 2, position: 'right', x: 270, y: 180 },

      // Row 3 - Back bench (3 seats)
      { id: 5, row: 3, position: 'left', x: 60, y: 310 },
      { id: 6, row: 3, position: 'center', x: 165, y: 310 },
      { id: 7, row: 3, position: 'right', x: 270, y: 310 }
    ]
  }
};

export const getVehicleLayout = (layoutType) => {
  return vehicleLayouts[layoutType] || vehicleLayouts.sprinter_15;
};
