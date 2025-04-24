document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search-user");
    const searchButton = document.getElementById("search-btn");
    const searchResults = document.getElementById("search-results");

    if (!searchInput || !searchButton || !searchResults) return; // Exit if elements don't exist on this page

    searchButton.addEventListener("click", () => {
        const query = searchInput.value.trim();
        if (query === "") return;

        fetch(`/search/users?q=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(users => {
                searchResults.innerHTML = "";
                if (users.length === 0) {
                    searchResults.innerHTML = "<p>No users found.</p>";
                    return;
                }

                users.forEach(user => {
                    const div = document.createElement("div");
                    div.className = "search-result";
                    div.textContent = `${user.username} (${user.email})`;
                    div.addEventListener("click", () => {
                        sessionStorage.setItem("privateChatTarget", user.username);
                        window.location.href = "/friend";  // Redirect to private chat
                    });
                    searchResults.appendChild(div);
                });
            })
            .catch(err => console.error("Error fetching users:", err));
    });
});
