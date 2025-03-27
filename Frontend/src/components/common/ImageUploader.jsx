import { useState } from "react";
import { uploadImage } from "../../api/images";

const ImageUploader = ({ onUploadSuccess, maxFiles, currentCount }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (currentCount >= maxFiles) {
      setError(`Maximum ${maxFiles} images allowed`);
      return;
    }

    setIsUploading(true);
    try {
      const fileId = await uploadImage(file);
      onUploadSuccess(fileId);
      setError("");
    } catch (err) {
      setError(err.message || "Image upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="image-uploader">
      <label>
        {isUploading ? "Uploading..." : "Upload Image"}
        <input
          type="file"
          accept="image/png, image/jpeg, image/gif"
          onChange={handleUpload}
          disabled={isUploading || currentCount >= maxFiles}
        />
      </label>
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default ImageUploader;
