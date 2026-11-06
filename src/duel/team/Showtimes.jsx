// Task 4 · Today's showtimes for a movie.
// Props: times (array of strings such as "19:30").
export default function Showtimes({ times }) {
  // Compare with 0 explicitly: `times.length && ...` would render a loose "0".
  if (times.length === 0) {
    return <p>Sin funciones hoy</p>;
  }

  return (
    <ul className="showtimes">
      {times.map((time) => (
        <li key={time}>{time}</li>
      ))}
    </ul>
  );
}
