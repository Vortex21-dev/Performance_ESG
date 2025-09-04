
import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';

interface FormSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  required?: boolean;
  placeholder?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  value,
  onChange,
  options,
  error,
  required,
  placeholder = 'Sélectionnez une option',
}) => {
  const selected = options.find((o) => o.value === value);

  return (
    <Listbox value={value} onChange={onChange}>
      {({ open }) => (
        <div className="space-y-2">
          <Listbox.Label className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Listbox.Label>

          {/* relative container keeps the button inline */}
          <div className="relative">
            <Listbox.Button
              className={`
                relative w-full rounded-xl border-2 border-gray-200 bg-white
                py-3 pl-4 pr-10 text-left text-gray-900
                transition-all duration-200 ease-in-out
                ${error
                  ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                  : 'hover:border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-100'
                }
                focus:outline-none
                disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50
              `}
            >
              <span className={`block truncate ${!selected ? 'text-gray-400' : 'text-gray-900'}`}>
                {selected?.label || placeholder}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${open ? 'rotate-180' : ''} ${
                    error ? 'text-red-400' : 'text-gray-400'
                  }`}
                />
              </span>
            </Listbox.Button>

            {/* floating listbox */}
            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options
                className="
                  absolute z-50 mt-2 w-full max-h-60 overflow-auto
                  rounded-xl bg-white py-2 text-base shadow-xl
                  ring-1 ring-black ring-opacity-5 focus:outline-none
                  border border-gray-200
                "
              >
                {options.map((opt) => (
                  <Listbox.Option
                    key={opt.value}
                    value={opt.value}
                    className={({ active, selected }) =>
                      `relative cursor-pointer select-none py-3 pl-10 pr-4 transition-colors
                       ${active ? 'bg-green-50 text-green-900' : ''}
                       ${selected ? 'bg-green-100 text-green-900' : 'text-gray-900 hover:bg-gray-50'}`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                          {opt.label}
                        </span>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-green-600">
                            <Check className="h-5 w-5" />
                          </span>
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>

          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <Check className="w-4 h-4" />
              {error}
            </p>
          )}
        </div>
      )}
    </Listbox>
  );
};