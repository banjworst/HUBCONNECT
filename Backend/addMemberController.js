// Backend/addMemberController.js
// Controller: Add member to a club for HubConnect
// Author: Jayden

module.exports = function makeAddMemberController(connection) {
  return function addMember(req, res) {
    const { name, email, club_id } = req.body;

    if (!name || !email || !club_id) {
      return res.status(400).json({ error: "name, email, and club_id are required" });
    }

    // 1) Insert into User table
    const insertUserSql = `
      INSERT INTO User (name, email)
      VALUES (?, ?);
    `;

    connection.query(insertUserSql, [name, email], (err, result) => {
      if (err) {
        console.error("User insert error:", err);
        return res.status(500).json({ error: "Failed to create user" });
      }

      const newUserId = result.insertId;

      // 2) Insert into Membership table
      const insertMembershipSql = `
        INSERT INTO Membership (user_id, club_id, join_date, status)
        VALUES (?, ?, NOW(), 'active');
      `;

      connection.query(insertMembershipSql, [newUserId, club_id], (err2) => {
        if (err2) {
          console.error("Membership insert error:", err2);
          return res.status(500).json({ error: "Failed to add membership" });
        }

        res.json({
          message: "Member successfully added to club",
          user_id: newUserId,
          club_id,
        });
      });
    });
  };
};
