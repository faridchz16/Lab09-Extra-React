// TODO(team) · Task 4
// Props: times (array of strings such as "19:30").
// If times is empty: <p>Sin funciones hoy</p>. Otherwise a <ul> with one <li> per time.
export default function Showtimes({ times }) {
  if (times.length === 0) {
    return <p>Sin funciones hoy</p>;
  }

  return (
    <ul>
      {times.map((time) => (
        <li key={time}>{time}</li>
      ))}
    </ul>
  );
}