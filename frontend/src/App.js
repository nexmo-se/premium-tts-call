import { useState, useEffect, useMemo }from "react";
import "./App.css";
import { Buffer } from "buffer";
import { UserContext } from "./context/UserContext";
import { useQuery } from "./hooks/useQuery";
import { Home } from "./pages/home/index.js";

const APP_API_URL_USERS = `${process.env.REACT_APP_URL || ""}/api/users`;

export default function App() {
  const [user, setUser] = useState(null);

  const query = useQuery();

  const parseVidsJwt = () => {
    try {
      const vidsJwt = query.get("jwt") || process.env.REACT_APP_VIDS_JWT_SAMPLE || "";
      return JSON.parse(Buffer.from(vidsJwt.split(".")[1], "base64").toString());
    } catch (e) {
      console.log(e.message);
      return null;
    }
  };

  useEffect(() => {
    const vidsUser = parseVidsJwt();
    setUser({ ...vidsUser, userId: vidsUser.userid ||  Date.now() });
  }, []);

  useEffect(() => {
    if (user && !user.jwt) {
      fetch(`${APP_API_URL_USERS}/${user.userId}`, {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      }).then((res) => res.json()).then(({ jwt }) => {
        setUser({ ...user, jwt });
      })
      .catch(console.error);
    } else if (user) {
      console.log(user.username);
    }
  }, [user]);

  const value = useMemo(() => ({
    user,
    setUser,
  }),
  [ user, setUser ]);

  return (<div className="App">
    <UserContext.Provider value={value}>
      { user? <Home /> : <></> }
    </UserContext.Provider>
  </div>);
}
