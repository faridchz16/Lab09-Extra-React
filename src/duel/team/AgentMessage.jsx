// Task 8 · A message produced by an AI agent.
// Props: author (string), text (string from the agent, untrusted).
// Both go through {…}, so React escapes them and markup in the text is shown, never run.
export default function AgentMessage({ author, text }) {
  return (
    <p className="agent-message">
      <strong>{author}:</strong> <span>{text}</span>
    </p>
  );
}
