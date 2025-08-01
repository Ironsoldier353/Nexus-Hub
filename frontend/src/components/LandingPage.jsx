import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaChartLine } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import logo from '../assets/logo.webp';
import bgImage2 from '../assets/bg-image-2.jpg';

const LandingPage = () => {
  const user = useSelector((state) => state.auth?.user);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Smooth scroll to section
  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-6 py-6 bg-gradient-to-r from-gray-800 via-black to-gray-900 backdrop-blur-lg shadow-xl">
        <div className="flex items-center space-x-6">
          <img src={logo} alt="LumenHive Logo" className="h-14" />
          <span className="font-bold text-2xl">LumenHive</span>
        </div>
        <nav className="hidden md:flex space-x-12 text-gray-300">
          <button
            onClick={() => scrollToSection('features')}
            className="text-lg hover:text-white transition-all duration-300 hover:underline hover:underline-offset-4"
          >
            FEATURES
          </button>
          <button
            onClick={() => scrollToSection('aim')}
            className="text-lg hover:text-white transition-all duration-300 hover:underline hover:underline-offset-4"
          >
            AIM
          </button>
        </nav>
        <div className="flex items-center space-x-6">
          <Link
            to="/shop"
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold flex items-center space-x-2 text-lg px-5 py-3 rounded-lg transition-transform transform hover:scale-105 hover:bg-purple-500 shadow-lg"
          >
            <FaShoppingCart className="text-xl" />
            <span>Shop</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6 py-20 md:py-32 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${bgImage2})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
          Revolutionize Your Home with <span className="text-pink-400">Smart Automation</span>
        </h1>

        <p className="text-xl md:text-2xl mb-8 max-w-2xl text-gray-200 font-light leading-relaxed">
          <span className="font-semibold text-white">Effortlessly control your home</span>—from smart locks to personalized recipes based on your goals.
          Powered by <span className="text-pink-400 font-semibold">ESP32</span>, our system brings simplicity and convenience to your daily life.
        </p>

        {user ? (
          <div className="flex space-x-6">
            <Link
              to="/quick-guide"
              className="bg-gradient-to-r from-purple-800 to-teal-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-md"
            >
              Quick Guide
            </Link>
            <Link
              to={`/admin/dashboard/${user.room}`}
              className="group relative inline-flex items-center space-x-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold py-4 px-8 rounded-xl hover:opacity-90 transition-all duration-300 transform hover:scale-105 hover:rotate-1 shadow-lg hover:shadow-pink-500/25"
            >
              <FaChartLine className="text-xl group-hover:rotate-12 transition-transform duration-300" />
              <span className="relative">
                <span className="block transform group-hover:-translate-y-1 transition-transform duration-300">
                  Go to Dashboard
                </span>
              </span>
            </Link>
          </div>
        ) : (
          <div className="flex space-x-6">
            <Link
              to="/quick-guide"
              className="bg-gradient-to-r from-purple-800 to-teal-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-md"
            >
              Quick Guide
            </Link>
            <Link
              to="/find-room"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-md"
            >
              Find Room
            </Link>
            <Link
              to="/setup-room"
              className="bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-md"
            >
              Setup Room
            </Link>
          </div>
        )}
      </section>

      {/* Aim Section */}
      <section id="aim" className="py-16 md:py-24 bg-gray-800 text-center px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6">
            Our Vision & Mission
          </h2>
          <p className="text-md md:text-lg text-gray-300 leading-relaxed mb-6">
            At <span className="text-purple-400 font-semibold">LumenHive</span>, we envision a future where technology seamlessly integrates with daily life, simplifying tasks and elevating comfort. Our Smart Home Automation project is designed to enhance every household’s quality of life, empowering users to manage their homes effortlessly.
          </p>
          <p className="text-md md:text-lg text-gray-300 leading-relaxed">
            By harnessing the power of <span className="text-indigo-400 font-semibold">ESP32</span>, <span className="text-green-400 font-semibold">IoT</span>, and custom PCB design, we aim to create intuitive, accessible, and sustainable solutions. Our focus is on boosting safety, convenience, and personalization to transform houses into smart, responsive homes.
          </p>
        </div>

        {/* Call-to-Action */}
        <div className="mt-12">
          <Link
            to="/learn-more"
            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:bg-opacity-90 text-white text-lg font-semibold px-8 py-3 rounded-full transition-all transform hover:scale-105 shadow-lg"
          >
            Learn More
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-gray-900 text-center px-6">
        <h2 className="text-3xl md:text-4xl font-semibold text-white mb-12">Smart Home Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {[
            { title: "Smart recognition at door", description: "Control the security of your home remotely with our smart door lock system powered by ESP32." },
            { title: "Smart Cooking Assistant", description: "Manage your diet with ease. Our smart home automation system suggests recipes based on your calorie needs." },
            { title: "Voice Automated Music System", description: "An interactive voice controlled music player with spotify app." },
            { title: "Smart Water Dispenser", description: "The Smart Water Dispenser uses an IR sensor to dispense water automatically for hygiene and convenience." },
            { title: "Control appliances remotely", description: "Remotely manage your home appliances from anywhere." },
            { title: "Voice-Activated Home Assistant", description: "Integrate voice-activated technology to control various electronic appliances in your home." }
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 md:p-8 rounded-lg shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
            >
              <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
              <p className="text-sm md:text-base text-gray-200">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
