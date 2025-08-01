import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import s1 from "../../assets/quick-guide/add-member/s1.png";
import s2 from "../../assets/quick-guide/add-member/s2.png";
import s3 from "../../assets/quick-guide/add-member/s3.png";

const steps = [
  {
    title: "Step 1: Generate Invite Code",
    description:
      "Click on 'Generate Invite Code' to create a unique code for inviting members.",
    image: s1,
  },
  {
    title: "Step 2: Share the Code",
    description:
      "Share the generated code with the member you want to invite.",
    image: s2,
  },
  {
    title: "Step 3: Member Joins the Room",
    description:
      "The invited member can use the code to join the room successfully.",
    image: s3,
  },
  {
    title: "Congratulations!",
    description: "You've successfully invited a member to your room!",
    image: "/assets/images/congrats.png",
  },
];

const InviteMemberGuide = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate(); // Initialize navigate

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center p-6 relative">
      {/* Back to Quick Guide Button */}
      <button
        onClick={() => navigate("/quick-guide")}
        className="absolute top-4 left-4 bg-gray-600 text-white py-2 px-4 rounded-md text-sm transition-opacity opacity-70 hover:opacity-100 hover:bg-gray-700 focus:outline-none"
      >
        <ArrowLeft className="w-4 h-4 inline-block mr-2" />
        Quick Guide
      </button>

      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-8 relative">
        {/* Header */}
        <div className="text-center">
          <motion.h1
            className="text-3xl font-bold text-blue-700"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Invite and Add Member Guide
          </motion.h1>
          <motion.p
            className="text-gray-600 mt-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Follow the steps below to invite a member to your room seamlessly.
          </motion.p>
        </div>

        {/* Step Content */}
        <div className="mt-8 flex flex-col items-center">
          <AnimatePresence exitBeforeEnter>
            <motion.div
              key={currentStep}
              className="text-center space-y-4"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-semibold text-blue-500">
                {steps[currentStep].title}
              </h2>
              <p className="text-gray-500">{steps[currentStep].description}</p>
              <img
                src={steps[currentStep].image}
                alt={`Step ${currentStep + 1}`}
                className="w-full max-w-md rounded-lg shadow-md"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between items-center">
          <Button
            variant="outline"
            className={`flex items-center ${
              currentStep === 0 ? "opacity-50 pointer-events-none" : ""
            }`}
            onClick={handlePrevious}
          >
            <ArrowRight className="w-5 h-5 transform rotate-180 mr-2" />
            Previous
          </Button>
          <Button
            className={`flex items-center ${
              currentStep === steps.length - 1
                ? "opacity-50 pointer-events-none"
                : ""
            }`}
            onClick={handleNext}
          >
            {currentStep === steps.length - 1 ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <ArrowRight className="w-5 h-5 mr-2" />
            )}
            {currentStep === steps.length - 1 ? "Done" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InviteMemberGuide;
