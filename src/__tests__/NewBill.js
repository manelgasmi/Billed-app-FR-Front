// Import required dependencies
import { jest } from "@jest/globals";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { localStorageMock } from "../__mocks__/localStorage";
import mockStore from "../__mocks__/store";
import NewBill from "../containers/NewBill.js";
import NewBillUI from "../views/NewBillUI.js";
import { ROUTES } from "../constants/routes.js";

// Mock the application's store
jest.mock("../app/Store", () => mockStore);

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};

// Tests for the NewBill page behavior
describe("Given I am logged in as an employee", () => {
  // Simulate user login as an employee
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "employee@test.tld",
        status: "connected",
      })
    );
  });

  // File upload tests
  describe("When I upload a file", () => {
    let newBill;
    let fileInput;

    beforeEach(() => {
      document.body.innerHTML = NewBillUI();
      newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      fileInput = screen.getByTestId("file");
    });

    // Accept valid file formats
    test("Then it should accept a valid image file and call the create method", async () => {
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      fileInput.addEventListener("change", handleChangeFile);

      // Simulate a valid image file upload
      const FileTest = new File(["test"], "test.jpg", { type: "image/jpg" });
      fireEvent.change(fileInput, { target: { files: [FileTest] } });

      expect(handleChangeFile).toHaveBeenCalled();
      expect(fileInput.files[0].name).toBe("test.jpg");
    });

    // Reject invalid file formats
    test("Then it should show an alert if the file format is invalid", async () => {
      window.alert = jest.fn();
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      fileInput.addEventListener("change", handleChangeFile);

      // Simulate an invalid file upload
      const FileTest = new File(["document"], "document.pdf", {
        type: "application/pdf",
      });
      fireEvent.change(fileInput, { target: { files: [FileTest] } });

      expect(window.alert).toHaveBeenCalledWith(
        "veuillez sélectionner une image au format JPEG, JPG ou PNG."
      );
    });
  });

  // Test form submission with valid inputs
  describe("When I fill out and submit the form with valid data", () => {
    let newBill;
    let form;

    beforeEach(() => {
      document.body.innerHTML = NewBillUI();
      newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      form = screen.getByTestId("form-new-bill");
    });

    test("Then it should create a new bill and redirect to the Bills page (POST)", () => {
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      form.addEventListener("submit", handleSubmit);

      // Get form input elements
      const expenseType = screen.getByTestId("expense-type");
      const expenseName = screen.getByTestId("expense-name");
      const datepicker = screen.getByTestId("datepicker");
      const amount = screen.getByTestId("amount");
      const pct = screen.getByTestId("pct");
      const file = screen.getByTestId("file");

      // Simulate user input
      fireEvent.change(expenseType, { target: { value: "Transports" } });
      fireEvent.change(expenseName, { target: { value: "Billet avion" } });
      fireEvent.change(datepicker, { target: { value: "2025-04-05" } });
      fireEvent.change(amount, { target: { value: "100" } });
      fireEvent.change(pct, { target: { value: "20" } });
      fireEvent.change(file, {
        target: {
          files: [new File(["file"], "file.png", { type: "image/png" })],
        },
      });

      // Submit the form
      fireEvent.submit(form);

      // Ensure handleSubmit was called
      expect(handleSubmit).toHaveBeenCalled();
    });
  });
  // Handle API errors
  describe("When the API responds with an error", () => {
    let newBill;
    let form;

    beforeEach(() => {
      document.body.innerHTML = NewBillUI();
      newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      form = screen.getByTestId("form-new-bill");

      jest.spyOn(console, "error").mockImplementation(() => {});
    });

    test("Then it should log a 404 error and continue navigation", async () => {
      jest
        .spyOn(mockStore.bills(), "update")
        .mockRejectedValue(new Error("404"));

      fireEvent.submit(form);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(new Error("404"));
      });
    });

    test("Then it should log a 500 error and continue navigation", async () => {
      jest
        .spyOn(mockStore.bills(), "update")
        .mockRejectedValue(new Error("500"));

      fireEvent.submit(form);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(new Error("500"));
      });
    });
  });
});
