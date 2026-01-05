// Vehicle layout configurations
// Each seat has: id, x, y positions for SVG rendering

export const vehicleLayouts = {
  sprinter_15: {
    name: 'Mercedes Sprinter 2017 (15 Passenger)',
    totalSeats: 15,
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

      // Row 6 - Back bench (4 seats)
      { id: 12, row: 6, position: 'left', x: 50, y: 410 },
      { id: 13, row: 6, position: 'center-left', x: 130, y: 410 },
      { id: 14, row: 6, position: 'center-right', x: 200, y: 410 },
      { id: 15, row: 6, position: 'right', x: 280, y: 410 }
    ]
  },

  bus_30: {
    name: '30-Passenger Bus',
    totalSeats: 30,
    seats: [
      // Front row
      { id: 1, row: 1, position: 'right', x: 250, y: 50 },
      { id: 2, row: 1, position: 'far-right', x: 320, y: 50 },

      // Rows 2-8 (2 seats per side = 4 seats per row, 7 rows = 28 seats)
      ...Array.from({ length: 7 }, (_, rowIndex) => {
        const row = rowIndex + 2;
        const yPos = 50 + (row * 60);
        return [
          { id: 3 + (rowIndex * 4), row, position: 'left', x: 50, y: yPos },
          { id: 4 + (rowIndex * 4), row, position: 'center-left', x: 120, y: yPos },
          { id: 5 + (rowIndex * 4), row, position: 'center-right', x: 250, y: yPos },
          { id: 6 + (rowIndex * 4), row, position: 'right', x: 320, y: yPos }
        ];
      }).flat()
    ]
  }
};

export const getVehicleLayout = (layoutType) => {
  return vehicleLayouts[layoutType] || vehicleLayouts.sprinter_15;
};
