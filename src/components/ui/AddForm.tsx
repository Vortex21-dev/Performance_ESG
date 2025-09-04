
import React from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { validateAdd } from '../../utils/validation';
import toast from 'react-hot-toast';

interface AddFormProps {
  onSubmit: (data: {
    name: string;
    parentId?: string;
    unit?: string;
    type: 'primaire' | 'calculé';
    axe: 'Environnement' | 'Social' | 'Gouvernance';
    formule: 'somme' | 'dernier_mois' | 'moyenne' | 'max' | 'min';
    frequence: 'mensuelle' | 'trimestrielle' | 'annuelle';
  }) => Promise<void>;
  onCancel: () => void;
  placeholder: string;
  label: string;
  parentOptions?: { id: string; name: string }[];
  parentLabel?: string;
  showUnit?: boolean;
  type: 'sector' | 'subsector' | 'standard' | 'issue' | 'criteria' | 'indicator';
}

const AddForm: React.FC<AddFormProps> = ({
  onSubmit,
  onCancel,
  placeholder,
  label,
  parentOptions,
  parentLabel,
  showUnit,
  type
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<{
    name: string;
    parentId?: string;
    unit?: string;
    type: 'primaire' | 'calculé';
    axe: 'Environnement' | 'Social' | 'Gouvernance';
    formule: 'somme' | 'dernier_mois' | 'moyenne' | 'max' | 'min';
    frequence: 'mensuelle' | 'trimestrielle' | 'annuelle';
  }>();

  const handleFormSubmit = async (data: {
    name: string;
    parentId?: string;
    unit?: string;
    type: 'primaire' | 'calculé';
    axe: 'Environnement' | 'Social' | 'Gouvernance';
    formule: 'somme' | 'dernier_mois' | 'moyenne' | 'max' | 'min';
    frequence: 'mensuelle' | 'trimestrielle' | 'annuelle';
  }) => {
    try {
      const isValid = await validateAdd(type, data.name, data.parentId);
      if (!isValid) return;

      await onSubmit(data);
      toast.success(`${label} ajouté avec succès`);
    } catch (err) {
      console.error('Error in handleFormSubmit:', err);
      toast.error(`Erreur lors de l'ajout de ${label.toLowerCase()}`);
    }
  };

  return (
    <div className="relative p-6 rounded-lg border-2 border-dashed border-gray-300 bg-white shadow-sm transition-all">
      <button
        onClick={onCancel}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Champ parent (critère ou autre) */}
        {parentOptions && parentLabel && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {parentLabel}
            </label>
            <select
              {...register('parentId', { required: 'Ce champ est requis' })}
              className="w-full px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            >
              <option value="">Sélectionnez une option</option>
              {parentOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            {errors.parentId && (
              <p className="mt-1 text-sm text-red-600">{errors.parentId.message}</p>
            )}
          </div>
        )}

        {/* Nom */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
          <input
            {...register('name', {
              required: 'Ce champ est requis',
              minLength: {
                value: 2,
                message: 'Le nom doit contenir au moins 2 caractères'
              }
            })}
            className="w-full px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            placeholder={placeholder}
            autoFocus
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Unité */}
        {showUnit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unité de mesure
            </label>
            <input
              {...register('unit')}
              className="w-full px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              placeholder="Ex: kg CO2e, kWh, %"
            />
          </div>
        )}

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            {...register('type', { required: 'Type requis' })}
            className="w-full px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          >
            <option value="primaire">Primaire</option>
            <option value="calculé">Calculé</option>
          </select>
          {errors.type && (
            <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>

        {/* Axe */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Axe
          </label>
          <select
            {...register('axe', { required: 'Axe requis' })}
            className="w-full px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          >
            <option value="Environnement">Environnement</option>
            <option value="Social">Social</option>
            <option value="Gouvernance">Gouvernance</option>
          </select>
          {errors.axe && (
            <p className="mt-1 text-sm text-red-600">{errors.axe.message}</p>
          )}
        </div>

        {/* Formule */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Formule
          </label>
          <select
            {...register('formule', { required: 'Formule requise' })}
            className="w-full px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          >
            <option value="somme">Somme</option>
            <option value="dernier_mois">Dernier mois</option>
            <option value="moyenne">Moyenne</option>
            <option value="max">Max</option>
            <option value="min">Min</option>
          </select>
          {errors.formule && (
            <p className="mt-1 text-sm text-red-600">{errors.formule.message}</p>
          )}
        </div>

        {/* Fréquence */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fréquence
          </label>
          <select
            {...register('frequence', { required: 'Fréquence requise' })}
            className="w-full px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          >
            <option value="mensuelle">Mensuelle</option>
            <option value="trimestrielle">Trimestrielle</option>
            <option value="annuelle">Annuelle</option>
          </select>
          {errors.frequence && (
            <p className="mt-1 text-sm text-red-600">{errors.frequence.message}</p>
          )}
        </div>

        {/* Boutons */}
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Ajout en cours...' : 'Ajouter'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddForm;