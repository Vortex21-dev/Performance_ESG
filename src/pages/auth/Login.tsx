import { Link } from 'react-router-dom';
import { LoginForm } from '../../components/auth/LoginForm';

export function Login() {
  return (
    <div className="min-h-screen flex">
      {/* Image de fond côté gauche avec logo blanc centré en haut */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="/Image VSG .jpg"
          alt="Entreprise durable"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-20">
          {/* Logo blanc centré en haut */}
          <div className="flex justify-center pt-6">
            <img
              src="/Logo blanc VSG.png"
              alt="Global ESG"
              className="h-24 w-auto"
            />
          </div>
        </div>
      </div>

      {/* Formulaire de connexion côté droit */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center mb-8">
            {/* Logo coloré en haut du formulaire */}
            <div className="flex justify-center mb-6">
              <img
                src="/Logo VSG.png"
                alt="Global ESG"
                className="h-20 w-auto"
              />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Connexion
            </h2>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10 border border-gray-100">
            <LoginForm />
          </div>
        </div>

      </div>
    </div>
  );
}
