import "./SubmitPage.scss";
import React, { useState } from "react";
import Grid from "@mui/material/Grid";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import CircularProgress from '@mui/material/CircularProgress';
import { gridData } from "../gridData.js";
import axios from "axios";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#fff",
    },
    secondary: {
      main: "#a89368",
    },
  },
});

const SubmitPage = () => {
  document.title = "Submit Images - SFM Reference";
  const [formData, setFormData] = useState({
    author: "",
    url: "",
    category: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [dragEntered, setDragEntered] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  const handleChange = (event, property) => {
    setFormData({ ...formData, [property]: event.target.value });

    // check for invalid url
    if (event.target.id && event.target.id.includes("url")) {
      try {
        new URL(event.target.value);
        setErrorMessage("");
      } catch (e) {
        if (e instanceof TypeError) {
          setErrorMessage("Invalid URL");
        }
      }
    }
  };

  /*
   * Updates uploadedImage state only if certain conditions are met
   * Current conditions:
   ** File type is .png, .jpg, or .jpeg
   ** File size is less than 5MB
   */
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!validateFileType(file)) {
      alert("Images must be .png, .jpg, or .jpeg.");
    } else if (!validateFileSize(file)) {
      alert("Images must be less than 5MB.");
    } else {
      setUploadedImage(file);
    }
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    setDragEntered(false);

    const file = event.dataTransfer.files[0];
    if (!validateFileType(file)) {
      alert("Images must be .png, .jpg, or .jpeg.");
    } else if (!validateFileSize(file)) {
      alert("Images must be less than 5MB.");
    } else {
      setUploadedImage(file);
    }
  };

  const validateFileType = (file) => {
    if (file.type === "image/png" || file.type === "image/jpeg") {
      // Accepts .jpg, .jpeg, .png
      return true;
    } else {
      return false;
    }
  };

  const validateFileSize = (file) => {
    if (file.size < 5242880) {
      // 1 MB = 1048576 bytes * 5
      return true;
    } else {
      return false;
    }
  };

  /*
   * Encodes the uploaded image to a base64 string and
   * Stores the encoded image, along with other metadata, in a JSON object then
   * Sends it to the backend.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (uploadedImage == null) {
      alert("Don't forget to upload an image!");
      return;
    }

    try {
      const reader = new FileReader();
      var base64Image = null;

      // Create a promise to handle the asynchronous file reading
      const readImageFile = (file) => {
        return new Promise((resolve, reject) => {
          reader.onload = function (e) {
            base64Image = e.target.result; // Encode image to base64 string
            resolve(base64Image);
          };

          reader.onerror = function (error) {
            reject(error);
          };

          reader.readAsDataURL(file);
        });
      };

      readImageFile(uploadedImage)
        .then((base64Image) => {
          var form = JSON.stringify({
            image: base64Image,
            image_filename: uploadedImage.name,
            author: formData.author,
            url: formData.url,
            category: formData.category,
          });

          setShowSpinner(true);

          return axios.post(process.env.REACT_APP_BACKEND_URL, form);
        })
        .then(() => {
          setFormSubmitted(true);
          setShowSpinner(false);
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    } catch (error) {
      console.error("Error:", error.message);
    }
  };

  return (
    <Grid
      container
      direction="column"
      alignItems="center"
      justifyContent="center"
      sx={{ minHeight: "80vh" }}
      className="submit-page"
    >
      <h1 className="submit-page-title">Submit your artwork to the website!</h1>
      <ThemeProvider theme={theme}>
        <form onSubmit={(e) => handleSubmit(e)}>
          <FormControl>
            <div className="submit-page-form-container">
              <label htmlFor="files">
                <div
                  className="submit-page-upload-image-container"
                  style={{
                    backgroundColor: dragEntered ? "#333" : "transparent",
                  }}
                  onDrop={(e) => handleFileDrop(e)}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={() => setDragEntered(true)}
                  onDragLeave={() => setDragEntered(false)}
                >
                  {uploadedImage ? (
                    <img
                      alt="thumbnail"
                      src={URL.createObjectURL(uploadedImage)}
                      className="submit-page-upload-image-thumbnail"
                    />
                  ) : (
                    <div className="submit-page-upload-image-text">
                      <b>Select Image</b> or <b>Drag and Drop</b>
                      <br />
                      <p className="submit-page-upload-image-text-limits">
                        PNG or JPEG only.
                        <br />
                        5MB max file size.
                      </p>
                    </div>
                  )}
                </div>
              </label>
              <input
                id="files"
                type="file"
                accept="image/png, image/jpeg"
                multiple={true}
                style={{ display: "none" }}
                onChange={(e) => handleImageUpload(e)}
                disabled={formSubmitted}
              />
              <TextField
                required
                fullWidth
                id="submit-page-input-author"
                label="Author"
                title="Name or username of the artist. List multiple authors separated by commas."
                value={formData.name}
                onChange={(e) => handleChange(e, "author")}
                disabled={formSubmitted}
              />
              <TextField
                fullWidth
                id="submit-page-input-url"
                label="Source URL"
                title="Direct link to the artwork (e.g. Twitter, Steam, Reddit). Include the https:// prefix."
                value={formData.url}
                onChange={(e) => handleChange(e, "url")}
                error={errorMessage !== ""}
                helperText={errorMessage}
                disabled={formSubmitted}
              />
              <TextField
                required
                select
                fullWidth
                id="submit-page-select"
                label="Category"
                title="Must fit into one existing category."
                defaultValue=""
                value={formData.category}
                onChange={(e) => handleChange(e, "category")}
                disabled={formSubmitted}
              >
                {Object.values(gridData).map((value) => (
                  <MenuItem key={value.tag} value={value.tag}>
                    {value.tag}
                  </MenuItem>
                ))}
              </TextField>

              <Button
                variant="contained"
                type="submit"
                disabled={formSubmitted}
              >
                Submit
              </Button>
              {showSpinner && (<CircularProgress />)}
              {formSubmitted && (
                <div className="submit-page-submitted">
                  <p className="submit-page-submitted-text">
                    Submitted! Thank you!
                  </p>
                  <Button
                    variant="outlined"
                    onClick={() => window.location.reload()}
                  >
                    Click to Refresh
                  </Button>
                </div>
              )}
            </div>
          </FormControl>
        </form>
      </ThemeProvider>
      <Divider
        flexItem
        variant="middle"
        sx={{
          alignSelf: "auto",
          width: "50%",
          mt: "1.5em",
          bgcolor: "rgb(50, 50, 50)",
        }}
      />
      <h5 className="submit-page-subtitle">
        All submissions will be manually reviewed and only added if they clearly
        fit into an existing category on the website, are safe for work, and are
        sufficiently high quality, though specifics will vary.
        <br />
        <br />
        This is solely intended to maintain a subjective level of quality on SFM
        Reference. If you would like feedback on your pieces, the SFM Discord or
        r/SFM are good places to start.
      </h5>
    </Grid>
  );
};

export default SubmitPage;
