// Vehicle layout configurations
// Each seat has: id, x, y positions for SVG rendering

export const vehicleLayouts = {
  sprinter_15: {
    name: 'Mercedes Sprinter Black (13 Seats)',
    totalSeats: 13,
    hasDriverName: true,
    seats: [
      // Front row - 2 passenger seats next to driver
      { id: 1, row: 1, position: 'center', x: 180, y: 50 },
      { id: 2, row: 1, position: 'right', x: 250, y: 50 },

      // Row 2 - Captain's chairs (2 seats, aisle in middle)
      { id: 3, row: 2, position: 'left', x: 80, y: 130 },
      { id: 4, row: 2, position: 'right', x: 250, y: 130 },

      // Row 3 - Single seats (2 seats)
      { id: 5, row: 3, position: 'left', x: 80, y: 200 },
      { id: 6, row: 3, position: 'right', x: 250, y: 200 },

      // Row 4 - Single seats (2 seats)
      { id: 7, row: 4, position: 'left', x: 80, y: 270 },
      { id: 8, row: 4, position: 'right', x: 250, y: 270 },

      // Row 5 - Bench seats (3 seats)
      { id: 9, row: 5, position: 'left', x: 60, y: 340 },
      { id: 10, row: 5, position: 'center', x: 165, y: 340 },
      { id: 11, row: 5, position: 'right', x: 270, y: 340 },

      // Row 6 - Back bench (2 seats)
      { id: 12, row: 6, position: 'left', x: 130, y: 410 },
      { id: 13, row: 6, position: 'right', x: 200, y: 410 }
    ]
  },

  bus_30: {
    name: 'Mercedes Sprinter White (10 Seats)',
    totalSeats: 10,
    hasDriverName: true,
    seats: [
      // Front row - 1 passenger seat next to driver
      { id: 1, row: 1, position: 'right', x: 250, y: 50 },

      // Row 2 - Captain's chairs (2 seats, aisle in middle)
      { id: 2, row: 2, position: 'left', x: 80, y: 130 },
      { id: 3, row: 2, position: 'right', x: 250, y: 130 },

      // Row 3 - Single seats (2 seats)
      { id: 4, row: 3, position: 'left', x: 80, y: 200 },
      { id: 5, row: 3, position: 'right', x: 250, y: 200 },

      // Row 4 - Single seats (2 seats)
      { id: 6, row: 4, position: 'left', x: 80, y: 270 },
      { id: 7, row: 4, position: 'right', x: 250, y: 270 },

      // Row 5 - Bench seats (3 seats)
      { id: 8, row: 5, position: 'left', x: 60, y: 340 },
      { id: 9, row: 5, position: 'center', x: 165, y: 340 },
      { id: 10, row: 5, position: 'right', x: 270, y: 340 }
    ]
  },

  highlander_7: {
    name: 'Toyota Highlander (7 Seats)',
    totalSeats: 7,
    hasDriverName: true,
    seats: [
      // Front row - 1 passenger seat next to driver
      { id: 1, row: 1, position: 'right', x: 250, y: 50 },

      // Row 2 - Captain's chairs (2 seats, aisle in middle)
      { id: 2, row: 2, position: 'left', x: 80, y: 180 },
      { id: 3, row: 2, position: 'right', x: 250, y: 180 },

      // Row 3 - Back bench (4 seats)
      { id: 4, row: 3, position: 'left', x: 50, y: 350 },
      { id: 5, row: 3, position: 'center-left', x: 130, y: 350 },
      { id: 6, row: 3, position: 'center-right', x: 200, y: 350 },
      { id: 7, row: 3, position: 'right', x: 280, y: 350 }
    ]
  }
};

export const getVehicleLayout = (layoutType) => {
  return vehicleLayouts[layoutType] || vehicleLayouts.sprinter_15;
};
