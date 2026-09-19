const USERS_KEY = "ecoshop_users";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const readUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
const writeUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

export async function registerUser({ name, email, password }) {
  await wait(400);
  const users = readUsers();
  if (users.some((u) => u.email === email)) {
    throw new Error("An account with this email already exists.");
  }
  const user = { id: crypto.randomUUID(), name, email, password };
  writeUsers([...users, user]);
  const { password: _pw, ...safeUser } = user;
  return safeUser;
}

export async function loginUser({ email, password }) {
  await wait(400);
  const users = readUsers();
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) throw new Error("Invalid email or password.");
  const { password: _pw, ...safeUser } = user;
  return safeUser;
}
