import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { getTrip, createRegistration, getRegistrationsByTrip } from '../utils/firestoreUtils';
import VehicleSeatingMap from '../components/VehicleSeatingMap';
import Header from '../components/Header';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';
import colors from '../utils/colors';

const CANCELLATION_POLICY = `CANCELLATION POLICY

1. Cancellations made 30 days or more before the trip date will receive a full refund.
2. Cancellations made 15-29 days before the trip date will receive a 50% refund.
3. Cancellations made less than 15 days before the trip date are non-refundable.
4. No-shows on the trip date are non-refundable.
5. Trip organizers reserve the right to cancel trips due to weather, safety concerns, or insufficient participation, in which case full refunds will be provided.`;

const WAIVER_TEXT = `WAIVER OF LIABILITY AND ASSUMPTION OF RISK

I, the undersigned, hereby acknowledge that I am voluntarily participating in this trip and related activities. I understand that such participation involves inherent risks, including but not limited to personal injury, property damage, or death.

In consideration of being permitted to participate in this trip, I hereby:

1. WAIVE, RELEASE, AND DISCHARGE the trip organizers, their officers, employees, and agents from any and all liability for any loss, damage, injury, or death that may occur during my participation.

2. ASSUME ALL RISKS associated with participation in this trip, whether known or unknown.

3. AGREE TO INDEMNIFY AND HOLD HARMLESS the trip organizers from any claims, actions, or losses arising from my participation.

4. CONSENT to receive emergency medical treatment if necessary.

I have read this waiver, fully understand its terms, and sign it freely and voluntarily.`;

const RegistrationForm = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const signatureRef = useRef(null);
  const { language } = useLanguage();
  const t = translations[language];

  const [trip, setTrip] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [numberOfSeats, setNumberOfSeats] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengers, setPassengers] = useState([{
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    preferredPickupPlace: '',
    seatNumber: null
  }]);
  const [paymentMethod, setPaymentMethod] = useState('on-trip');
  const [useSameEmail, setUseSameEmail] = useState(false);

  const [agreements, setAgreements] = useState({
    cancellationPolicy: false,
    waiver: false
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadTripData();
  }, [tripId]);

  useEffect(() => {
    // Update passengers array when number of seats changes
    const newPassengers = Array.from({ length: numberOfSeats }, (_, i) =>
      passengers[i] || {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        preferredPickupPlace: '',
        seatNumber: null
      }
    );
    setPassengers(newPassengers);
    setSelectedSeats(newPassengers.map(p => p.seatNumber).filter(Boolean));
  }, [numberOfSeats]);

  const loadTripData = async () => {
    try {
      console.log('Loading trip with ID:', tripId);
      const [tripData, regsData] = await Promise.all([
        getTrip(tripId),
        getRegistrationsByTrip(tripId)
      ]);
      console.log('Trip data loaded:', tripData);
      console.log('Registrations loaded:', regsData);
      setTrip(tripData);
      setRegistrations(regsData);
    } catch (error) {
      console.error('Error loading trip data:', error);
      alert('Error loading trip: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate each passenger
    passengers.forEach((passenger, index) => {
      if (!passenger.firstName.trim()) newErrors[`passenger${index}FirstName`] = 'First name is required';
      if (!passenger.lastName.trim()) newErrors[`passenger${index}LastName`] = 'Last name is required';
      if (!passenger.email.trim()) newErrors[`passenger${index}Email`] = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(passenger.email)) newErrors[`passenger${index}Email`] = 'Email is invalid';
      if (!passenger.phone.trim()) newErrors[`passenger${index}Phone`] = 'Phone number is required';
      if (!passenger.seatNumber) newErrors[`passenger${index}Seat`] = 'Please select a seat';
    });

    if (!agreements.cancellationPolicy) newErrors.cancellationPolicy = 'You must agree to the cancellation policy';
    if (!agreements.waiver) newErrors.waiver = 'You must sign the waiver';
    if (signatureRef.current?.isEmpty()) newErrors.signature = 'Signature is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Get signature as base64 data URL
      const signatureData = signatureRef.current.toDataURL();

      // Create a registration for each passenger
      for (const passenger of passengers) {
        await createRegistration({
          tripId,
          firstName: passenger.firstName,
          lastName: passenger.lastName,
          email: passenger.email,
          phone: passenger.phone,
          seatNumber: passenger.seatNumber,
          paymentMethod,
          paid: false,
          signatureData,  // Store base64 signature directly in Firestore
          signatureUrl: '', // Keep field for backward compatibility
          pdfUrl: '',       // PDF will be generated by Cloud Function
          agreedToCancellationPolicy: true,
          agreedToWaiver: true,
          adminEmail: 'barpupco@gmail.com', // Store admin email for notifications
          registrationDate: new Date().toISOString()
        });
      }

      // Note: Email sending will be handled by Firebase Cloud Functions
      // The function will send confirmation emails to both user and admin

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting registration:', error);
      setErrors({ submit: 'Failed to submit registration. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading trip information...</div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Trip Not Found</h1>
          <p className="text-gray-600 mb-4">This trip link may be invalid or expired.</p>
          <div className="bg-gray-100 p-4 rounded-lg text-left">
            <p className="text-sm text-gray-700">
              <strong>Trip ID:</strong> {tripId}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              If you believe this is an error, please contact the trip organizer.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)' }}>
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: colors.success }} />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Registration Successful!
          </h1>
          <p className="text-gray-600 mb-4">
            Thank you for registering for <span className="font-semibold">{trip.title}</span>.
          </p>

          {/* Email Confirmation Notice */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Confirmation Email Sent!
                </p>
                <p className="text-xs text-blue-700">
                  A confirmation email with your trip details and signed waiver has been sent to:
                </p>
                <p className="text-sm font-semibold text-blue-900 mt-1">
                  {passengers[0].email}
                </p>
                {passengers.length > 1 && (
                  <p className="text-xs text-blue-700 mt-2">
                    Each passenger will receive their own confirmation email.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Seat Information */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#E0F7FA' }}>
            <p className="font-semibold mb-2" style={{ color: colors.primary.teal }}>
              {passengers.length === 1 ? 'Your Seat:' : 'Your Seats:'}
            </p>
            <p className="text-lg font-bold">
              {passengers.map(p => `#${p.seatNumber}`).join(', ')}
            </p>
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-sm text-gray-600">
            <p>Please check your email inbox and spam folder.</p>
            <p className="mt-2">If you don't receive the email within 10 minutes, please contact support.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)' }}>
      <Header showLogout={false} title={trip.title} subtitle={trip.date?.toDate().toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })} />

      <div className="max-w-4xl mx-auto py-8 px-4">

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Number of Seats */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Number of Seats</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How many seats do you need? *
              </label>
              <select
                value={numberOfSeats}
                onChange={(e) => setNumberOfSeats(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[1, 2, 3, 4, 5].map(num => (
                  <option key={num} value={num}>{num} {num === 1 ? 'seat' : 'seats'}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Passenger Information */}
          {passengers.map((passenger, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Passenger {index + 1} Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={passenger.firstName}
                    onChange={(e) => {
                      const newPassengers = [...passengers];
                      newPassengers[index].firstName = e.target.value;
                      setPassengers(newPassengers);
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors[`passenger${index}FirstName`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors[`passenger${index}FirstName`] && (
                    <p className="text-red-500 text-sm mt-1">{errors[`passenger${index}FirstName`]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={passenger.lastName}
                    onChange={(e) => {
                      const newPassengers = [...passengers];
                      newPassengers[index].lastName = e.target.value;
                      setPassengers(newPassengers);
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors[`passenger${index}LastName`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors[`passenger${index}LastName`] && (
                    <p className="text-red-500 text-sm mt-1">{errors[`passenger${index}LastName`]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={index === 0 || !useSameEmail ? passenger.email : passengers[0].email}
                    onChange={(e) => {
                      const newPassengers = [...passengers];
                      newPassengers[index].email = e.target.value;
                      setPassengers(newPassengers);
                      // If this is the first passenger and useSameEmail is enabled, update all
                      if (index === 0 && useSameEmail) {
                        newPassengers.forEach((p, i) => {
                          if (i > 0) p.email = e.target.value;
                        });
                        setPassengers(newPassengers);
                      }
                    }}
                    disabled={index > 0 && useSameEmail}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors[`passenger${index}Email`] ? 'border-red-500' : 'border-gray-300'
                    } ${index > 0 && useSameEmail ? 'bg-gray-100' : ''}`}
                  />
                  {errors[`passenger${index}Email`] && (
                    <p className="text-red-500 text-sm mt-1">{errors[`passenger${index}Email`]}</p>
                  )}
                  {/* Show checkbox only for first passenger and only if more than 1 seat */}
                  {index === 0 && numberOfSeats > 1 && (
                    <label className="flex items-center mt-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={useSameEmail}
                        onChange={(e) => {
                          setUseSameEmail(e.target.checked);
                          if (e.target.checked) {
                            // Copy first passenger's email to all others
                            const newPassengers = [...passengers];
                            const firstEmail = passengers[0].email;
                            newPassengers.forEach((p, i) => {
                              if (i > 0) p.email = firstEmail;
                            });
                            setPassengers(newPassengers);
                          }
                        }}
                        className="mr-2"
                        style={{ accentColor: colors.primary.teal }}
                      />
                      Use this email for all passengers
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={passenger.phone}
                    onChange={(e) => {
                      const newPassengers = [...passengers];
                      newPassengers[index].phone = e.target.value;
                      setPassengers(newPassengers);
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors[`passenger${index}Phone`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors[`passenger${index}Phone`] && (
                    <p className="text-red-500 text-sm mt-1">{errors[`passenger${index}Phone`]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Pickup Place
                  </label>
                  <input
                    type="text"
                    value={passenger.preferredPickupPlace}
                    onChange={(e) => {
                      const newPassengers = [...passengers];
                      newPassengers[index].preferredPickupPlace = e.target.value;
                      setPassengers(newPassengers);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Central Station, Hotel Name"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
            <div className="space-y-2">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: paymentMethod === 'card' ? colors.primary.teal : '#D1D5DB' }}>
                <input
                  type="radio"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-3"
                  style={{ accentColor: colors.primary.teal }}
                />
                <div>
                  <div className="font-medium text-gray-900">Pay with Card</div>
                  <div className="text-sm text-gray-500">Pay now using credit/debit card</div>
                </div>
              </label>
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: paymentMethod === 'on-trip' ? colors.primary.teal : '#D1D5DB' }}>
                <input
                  type="radio"
                  value="on-trip"
                  checked={paymentMethod === 'on-trip'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-3"
                  style={{ accentColor: colors.primary.teal }}
                />
                <div>
                  <div className="font-medium text-gray-900">Pay on Trip</div>
                  <div className="text-sm text-gray-500">Pay cash/card on the day of the trip</div>
                </div>
              </label>
            </div>
          </div>

          {/* Seat Selection */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Assign Seats to Passengers *
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Select a seat for each passenger from the dropdown below.
            </p>

            {passengers.map((passenger, index) => {
              const layout = trip.vehicleLayout;
              const totalSeats = layout === 'sprinter_15' ? 14 : layout === 'bus_30' ? 11 : 7;

              return (
                <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seat for Passenger {index + 1}: {passenger.firstName || '(Not entered)'} {passenger.lastName || ''} *
                  </label>
                  <select
                    value={passenger.seatNumber || ''}
                    onChange={(e) => {
                      const newPassengers = [...passengers];
                      newPassengers[index].seatNumber = e.target.value ? parseInt(e.target.value) : null;
                      setPassengers(newPassengers);
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors[`passenger${index}Seat`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a seat</option>
                    {Array.from({ length: totalSeats }, (_, i) => i + 1).map(seatNum => {
                      const isOccupied = registrations.some(reg => reg.seatNumber === seatNum);
                      const isReservedByOtherPassenger = passengers.some((p, pIndex) => pIndex !== index && p.seatNumber === seatNum);
                      const isDisabled = isOccupied || isReservedByOtherPassenger;

                      return (
                        <option key={seatNum} value={seatNum} disabled={isDisabled}>
                          Seat #{seatNum} {isOccupied ? '(Occupied)' : isReservedByOtherPassenger ? '(Selected for another passenger)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  {errors[`passenger${index}Seat`] && (
                    <p className="text-red-500 text-sm mt-1">{errors[`passenger${index}Seat`]}</p>
                  )}
                </div>
              );
            })}

            {/* Visual Seating Map - Interactive */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Seating Map - Click to Select Seats
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Tap on available (gray) seats to assign them to your passengers
              </p>

              {/* Show which passenger is being assigned */}
              {passengers.some(p => !p.seatNumber) && (
                <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900">
                    Next: Select seat for Passenger {passengers.findIndex(p => !p.seatNumber) + 1}
                    {passengers[passengers.findIndex(p => !p.seatNumber)]?.firstName &&
                      ` (${passengers[passengers.findIndex(p => !p.seatNumber)].firstName})`}
                  </p>
                </div>
              )}

              <VehicleSeatingMap
                vehicleType={trip.vehicleLayout}
                registrations={registrations}
                driverName={trip.driverName}
                selectedSeat={null}
                onSeatClick={(seatNumber) => {
                  // Find first passenger without a seat
                  const passengerIndex = passengers.findIndex(p => !p.seatNumber);
                  if (passengerIndex !== -1) {
                    const newPassengers = [...passengers];
                    newPassengers[passengerIndex].seatNumber = seatNumber;
                    setPassengers(newPassengers);
                  }
                }}
                reservedSeats={passengers.map(p => p.seatNumber).filter(Boolean)}
              />

              {/* Show assigned seats */}
              {passengers.some(p => p.seatNumber) && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Assigned Seats:</p>
                  <div className="flex flex-wrap gap-2">
                    {passengers.map((p, idx) =>
                      p.seatNumber && (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-300 rounded-full text-sm">
                          <span className="font-semibold">#{p.seatNumber}</span>
                          <span className="text-gray-600">
                            {p.firstName || `Passenger ${idx + 1}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const newPassengers = [...passengers];
                              newPassengers[idx].seatNumber = null;
                              setPassengers(newPassengers);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cancellation Policy */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Cancellation Policy</h2>
            <div className="bg-gray-50 p-4 rounded-lg max-h-48 overflow-y-auto mb-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                {CANCELLATION_POLICY}
              </pre>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreements.cancellationPolicy}
                onChange={(e) =>
                  setAgreements({ ...agreements, cancellationPolicy: e.target.checked })
                }
                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                I have read and agree to the cancellation policy *
              </span>
            </label>
            {errors.cancellationPolicy && (
              <p className="text-red-500 text-sm mt-2">{errors.cancellationPolicy}</p>
            )}
          </div>

          {/* Waiver */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Waiver of Liability</h2>
            <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto mb-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                {WAIVER_TEXT}
              </pre>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Digital Signature *
              </label>
              <div className={`border-2 rounded-lg ${errors.signature ? 'border-red-500' : 'border-gray-300'}`}>
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    className: 'w-full h-40 bg-white rounded-lg'
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => signatureRef.current?.clear()}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Clear Signature
              </button>
              {errors.signature && (
                <p className="text-red-500 text-sm mt-1">{errors.signature}</p>
              )}
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreements.waiver}
                onChange={(e) =>
                  setAgreements({ ...agreements, waiver: e.target.checked })
                }
                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                I have read, understand, and agree to the waiver of liability *
              </span>
            </label>
            {errors.waiver && (
              <p className="text-red-500 text-sm mt-2">{errors.waiver}</p>
            )}
          </div>

          {/* Submit */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
              {errors.submit}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: colors.primary.teal }}
            className="w-full text-white py-4 rounded-lg font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegistrationForm;
