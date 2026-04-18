import { useState } from "react";

type ResourceFormData = {
  name: string;
  type: string;
  capacity: string | number;
  location: string;
  availabilityStart: string;
  availabilityEnd: string;
  status: string;
};

type Props = {
  initialData: ResourceFormData;
  onSubmit: (data: ResourceFormData) => Promise<void>;
  submitLabel: string;
};

export default function ResourceForm({
  initialData,
  onSubmit,
  submitLabel,
}: Props) {
  const [formData, setFormData] = useState<ResourceFormData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.type.trim()) newErrors.type = "Type is required";

    if (formData.capacity === "") {
      newErrors.capacity = "Capacity is required";
    } else if (Number(formData.capacity) < 0) {
      newErrors.capacity = "Capacity cannot be negative";
    }

    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.availabilityStart)
      newErrors.availabilityStart = "Availability start is required";
    if (!formData.availabilityEnd)
      newErrors.availabilityEnd = "Availability end is required";
    if (!formData.status) newErrors.status = "Status is required";

    if (
      formData.availabilityStart &&
      formData.availabilityEnd &&
      formData.availabilityStart >= formData.availabilityEnd
    ) {
      newErrors.availabilityEnd = "End time must be later than start time";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            placeholder="Enter resource name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Type
          </label>
          <input
            type="text"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            placeholder="Lecture Hall / Lab / Meeting Room / Equipment"
          />
          {errors.type && (
            <p className="mt-1 text-sm text-red-500">{errors.type}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Capacity
          </label>
          <input
            type="number"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            placeholder="Enter capacity"
          />
          {errors.capacity && (
            <p className="mt-1 text-sm text-red-500">{errors.capacity}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            placeholder="Enter location"
          />
          {errors.location && (
            <p className="mt-1 text-sm text-red-500">{errors.location}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Availability Start
          </label>
          <input
            type="time"
            name="availabilityStart"
            value={formData.availabilityStart}
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
          />
          {errors.availabilityStart && (
            <p className="mt-1 text-sm text-red-500">
              {errors.availabilityStart}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Availability End
          </label>
          <input
            type="time"
            name="availabilityEnd"
            value={formData.availabilityEnd}
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
          />
          {errors.availabilityEnd && (
            <p className="mt-1 text-sm text-red-500">
              {errors.availabilityEnd}
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-500">{errors.status}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Please wait..." : submitLabel}
        </button>
      </div>
    </form>
  );
}