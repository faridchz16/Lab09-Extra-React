// Task 6 · A movie synopsis written by a third party (untrusted data).
// Props: text (string).
// {text} is escaped by React, so any markup in it is shown as text and never runs.
export default function Synopsis({ text }) {
  return <p className="synopsis">{text}</p>;
}
