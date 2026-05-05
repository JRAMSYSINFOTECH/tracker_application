const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export const generateAIPlan = async (tasks) => {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL,
      messages: [
        {
          role: "user",
          content: `Create a daily schedule for these tasks: ${JSON.stringify(tasks)}`
        }
      ]
    })
  });

  const data = await response.json();
  return data;
};