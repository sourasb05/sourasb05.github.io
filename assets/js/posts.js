/*
 * LEARN — list of posts for learn.html.
 *
 * To publish a new post:
 *   1. Write it in Markdown as posts/<slug>.md  (LaTeX math works: $inline$ and $$display$$)
 *   2. Add an entry at the TOP of this list (newest first):
 *        slug:    file name without .md
 *        title:   post title
 *        date:    "YYYY-MM-DD"
 *        topic:   "federated-learning", "continual-learning" or "genai"
 *        summary: one or two sentences shown on the card
 */
window.POSTS = [
  {
    slug: "federated-learning-in-five-minutes",
    title: "Federated Learning in Five Minutes",
    date: "2026-10-10",
    topic: "federated-learning",
    summary: "What federated learning is, how FedAvg works, and the four challenges that make it a rich research area."
  }
];
