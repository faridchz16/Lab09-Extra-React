// Task 7 · Featured movie banner.
// Props: movie (a movie object). The prop is called `movie`, as App passes it.
export default function Hero({ movie }) {
  return (
    <section aria-label="Destacada" className="hero">
      <h2>{movie.title}</h2>
      <a href={`#horarios-${movie.id}`}>Ver horarios</a>
    </section>
  );
}
