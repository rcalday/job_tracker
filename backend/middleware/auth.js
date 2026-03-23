import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
	const authHeader = req.headers.authorization;
	let token = null;

	if (authHeader && authHeader.startsWith("Bearer ")) {
		token = authHeader.split(" ")[1];
	} else if (req.cookies && req.cookies.accessToken) {
		token = req.cookies.accessToken;
	}

	if (!token) {
		return res.status(401).json({ error: "No token provided" });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded; // attach user info to request
		next();
	} catch (err) {
		return res.status(403).json({ error: "Invalid token" });
	}
};
