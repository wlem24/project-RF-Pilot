# In-memory user store for authentication.
# This dictionary is a temporary storage solution and will be cleared when the app restarts.
# Key: email (str)
# Value: dict with username, email, and hashed_password
users: dict[str, dict] = {}
