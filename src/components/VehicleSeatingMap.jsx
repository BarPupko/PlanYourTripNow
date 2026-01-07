import { getVehicleLayout } from '../utils/vehicleLayouts';
import colors from '../utils/colors';

const VehicleSeatingMap = ({ vehicleType, registrations, onSeatClick, selectedSeat, driverName, reservedSeats = [] }) => {
  const layout = getVehicleLayout(vehicleType);

  const getSeatOccupant = (seatNumber) => {
    return registrations?.find(reg => reg.seatNumber === seatNumber);
  };

  const getSeatColor = (seatNumber) => {
    const occupant = getSeatOccupant(seatNumber);
    if (occupant) return colors.seat.occupied; // Green for occupied
    if (reservedSeats.includes(seatNumber)) return colors.seat.occupied; // Reserved by other passengers in this form
    if (selectedSeat === seatNumber) return colors.seat.selected; // Teal for selected
    return colors.seat.vacant; // Gray for vacant
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4 text-center" style={{ color: colors.primary.teal }}>
        {layout.name}
      </h3>
      {driverName && (
        <div className="text-center mb-4 pb-4 border-b">
          <span className="text-sm text-gray-600">Driver: </span>
          <span className="font-semibold" style={{ color: colors.primary.teal }}>
            {driverName}
          </span>
        </div>
      )}

      <svg
        viewBox="0 0 400 500"
        className="w-full max-w-md mx-auto border-2 rounded-lg"
        style={{ borderColor: colors.primary.teal }}
      >
        {/* Vehicle outline */}
        <rect
          x="10"
          y="10"
          width="380"
          height="480"
          rx="20"
          fill="none"
          stroke={colors.primary.black}
          strokeWidth="3"
        />

        {/* Driver cabin separator */}
        <line
          x1="10"
          y1="100"
          x2="390"
          y2="100"
          stroke={colors.primary.black}
          strokeWidth="2"
          strokeDasharray="5,5"
        />

        {/* Driver seat */}
        <g>
          <rect
            x="30"
            y="40"
            width="50"
            height="50"
            rx="5"
            fill={colors.primary.black}
            stroke={colors.primary.teal}
            strokeWidth="2"
          />
          <text x="55" y="70" textAnchor="middle" fontSize="14" fill="white" fontWeight="bold">
            D
          </text>
          {driverName && (
            <text x="55" y="115" textAnchor="middle" fontSize="10" fill={colors.primary.teal} fontWeight="600">
              {driverName.split(' ')[0]}
            </text>
          )}
        </g>

        {/* Seats */}
        {layout.seats.map((seat) => {
          const occupant = getSeatOccupant(seat.id);
          const isClickable = onSeatClick;

          return (
            <g
              key={seat.id}
              onClick={() => isClickable && onSeatClick(seat.id, occupant)}
              className={isClickable ? 'cursor-pointer hover:opacity-80' : ''}
            >
              <rect
                x={seat.x - 25}
                y={seat.y - 15}
                width="50"
                height="35"
                rx="5"
                fill={getSeatColor(seat.id)}
                stroke="#4b5563"
                strokeWidth="2"
              />
              <text
                x={seat.x}
                y={seat.y + 5}
                textAnchor="middle"
                fontSize="14"
                fill={occupant || selectedSeat === seat.id ? 'white' : '#1f2937'}
                fontWeight="bold"
              >
                {seat.id}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: colors.seat.vacant, border: `2px solid ${colors.primary.black}` }}></div>
          <span>Vacant</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: colors.seat.occupied, border: `2px solid ${colors.primary.black}` }}></div>
          <span>Occupied</span>
        </div>
        {onSeatClick && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: colors.seat.selected, border: `2px solid ${colors.primary.black}` }}></div>
            <span>Selected</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleSeatingMap;
