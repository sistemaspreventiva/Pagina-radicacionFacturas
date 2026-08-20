import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import AmigoGuia from "./components/AmigoGuia.jsx";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <AppRoutes />
        <Footer />
        <AmigoGuia />
      </BrowserRouter>
    </AuthProvider>
  );
}
