@trip_date = Date.today()
@trip_name = "Test Trip"

@trip_data = {
  id: 8,
  passenger: RideShare::Passenger.new(
    id: 1,
    name: "Ada",
    phone_number: "412-432-7640"
  ),
  driver: RideShare::Driver.new(
    id: 1,
    name: "Valentine",
    vin: "DF5S6HFG365HGDCVG",
    status: :AVAILABLE
  ),
  start_time: start_time.to_s,
  end_time: end_time.to_s,
  cost: 23.45,
  rating: 3,
}
