// TODO(team) · Task 3
// Props: movie = { id, title, image, synopsis, rating, showtimes }.
// Returns an <article> with an <img src alt> (the alt is the title), an <h3> with
// the title and the rating as text, e.g. "★ 4.5".
export default function MovieCard({ movie }) {
  return (
    <article>
      <img src={movie.image} alt={movie.title} />
      <h3>{movie.title}</h3>
      <p>★ {movie.rating}</p>
    </article>
  );
}