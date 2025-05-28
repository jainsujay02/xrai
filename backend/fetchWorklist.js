export async function fetchWorklist() {
  const response = await fetch("http://localhost:5050/api/worklist", {
    // Don't include credentials for now
    method: "GET"
  });

  if (!response.ok) {
    throw new Error("Failed to fetch worklist");
  }

  const data = await response.json();
  return data;
}