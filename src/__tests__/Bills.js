/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import "@testing-library/jest-dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";
jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
        writable: true,
      });

      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
    });
    test("Then bill icon in vertical layout should be highlighted", async () => {
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      const iconActive = windowIcon.classList.contains("active-icon");
      //add expect mention
      expect(iconActive).toBeTruthy();
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    // checks that the handleClickNewBill function is properly triggered when clicking the "New Bill" button.
    test('Then clicking on the "New Bill" button should navigate to the New Bill page', async () => {
      const newBillButton = screen.getAllByTestId("btn-new-bill");
      newBillButton[0].click();
      await waitFor(() =>
        expect(window.location.href).toContain(ROUTES_PATH.NewBill)
      );
    });

    // verifies the handleClickIconEye function displays the modal on icon-eye click.
    test('Then clicking on the "Eye" icon should display the bill image in a modal', async () => {
      const modal = document.getElementById("modaleFile");
      $.fn.modal = jest.fn(() => modal.classList.add("show"));
      const eyeIcons = await screen.findAllByTestId("icon-eye");
      expect(eyeIcons.length).toBeGreaterThan(0);
      eyeIcons[0].click();
      expect(modal).toHaveClass("show");
    });

    // add integration test GET bills (404 & 500 error)
    test("fetches bills from an API and fails with 404 message error", async () => {
      jest.spyOn(mockStore, "bills").mockImplementationOnce(() => {
        return {
          list: () => Promise.reject(new Error("Erreur 404")),
        };
      });
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => {
        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });
    });
    test("fetches messages from an API and fails with 500 message error", async () => {
      jest.spyOn(mockStore, "bills").mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => {
        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
