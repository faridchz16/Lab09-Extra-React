export default function Synopsis({ text }) {
  // Rendered as a text child: React escapes it. Line breaks come from CSS (white-space: pre-line).
  return <p className="synopsis">{text}</p>;
}
