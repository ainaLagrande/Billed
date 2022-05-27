/**
* @jest-environment jsdom
*/

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH,ROUTES} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import Bills from "../containers/Bills.js"
import userEvent from "@testing-library/user-event"
import mockStore from "../__mocks__/store"

// Vertical layout
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon"))
      expect(windowIcon).toBeTruthy();
    })
    test("fetches bills from mock API GET", async () => {
      const billsBoard = new Bills({document, localStorage:localStorageMock,mockStore:{bills: () => mockStore}})
      const getSpy = jest.spyOn(billsBoard, "getBills")
      const bills = await billsBoard.getBills()
      expect(getSpy).toHaveBeenCalledTimes(1)
    })

    // Sort by date
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => (b - a)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    // Modale should open
    describe("When I click on the eye icon", () => {
      test("A modal should open", () => {
        document.body.innerHTML = BillsUI({ data: bills })
        const sampleBills = new Bills({document, onNavigate, localStorage: window.localStorage})
        sampleBills.handleClickIconEye = jest.fn()
        screen.getAllByTestId("icon-eye")[0].click()
        expect(sampleBills.handleClickIconEye).toBeCalled()
      })
      test("Then the modal should display the attached image", () => {
        document.body.innerHTML = BillsUI({ data: bills })
        const sampleBills = new Bills({document, onNavigate, localStorage: window.localStorage})
        const iconEye = document.querySelector(`div[data-testid="icon-eye"]`)
        $.fn.modal = jest.fn()
        sampleBills.handleClickIconEye(iconEye)
        expect($.fn.modal).toBeCalled()
        expect(document.querySelector(".modal")).toBeTruthy()
      })
    })
    // test handleClickNewBill
    describe('When I click on the new bill button', () => {
      test('I should navigate to new bill page', () => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'User'
        }))
        const html = BillsUI({data: bills})
        document.body.innerHTML = html
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const mockStore = null
        const billsBoard = new Bills({
          document, onNavigate, mockStore, localStorage: window.localStorage
        })
        const newBillBtn = screen.getByTestId('btn-new-bill')
        const handleClickNewBillBtn = jest.fn(billsBoard.handleClickNewBill)
        newBillBtn.addEventListener('click', handleClickNewBillBtn)
        userEvent.click(newBillBtn)
        expect(handleClickNewBillBtn).toHaveBeenCalled()
      })
    })

    // Test d'intégration GET
    describe('Given I am a user connected as Employee', () => { 
      describe('When I navigate to Bills', () => { 
        test('fetches bills from mock API GET', async () => {
          localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
          new Bills({
            document, onNavigate, mockStore, localStorage: window.localStorage
          })
          document.body.innerHTML = BillsUI({ data: bills })
          await waitFor(() => screen.getByText("Mes notes de frais"))
          expect(screen.getByText("Mes notes de frais")).toBeTruthy()
        })
      })
      describe('When an error occurs on API', () => { 
        beforeEach(() => {
          jest.spyOn(mockStore, "bills")
          Object.defineProperty(
              window,
              'localStorage',
              { value: localStorageMock }
          )
          window.localStorage.setItem('user', JSON.stringify({
            type: 'Employee',
            email: "a@a"
          }))
        })
        test('fetches bills from an API and fails with 404 message error', async () => { 
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list : () =>  {
                return Promise.reject(new Error("Erreur 404"))
              }
            }})
            const html = BillsUI({ error: "Erreur 404" })
            document.body.innerHTML = html
            const message = await screen.getByText(/Erreur 404/)
            expect(message).toBeTruthy()
        })
        test('fetches messages from an API and fails with 500 message error', async () => { 
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list : () =>  {
                return Promise.reject(new Error("Erreur 500"))
              }
            }})
            const html = BillsUI({ error: "Erreur 500" })
            document.body.innerHTML = html
            const message = await screen.getByText(/Erreur 500/)
            expect(message).toBeTruthy()
          })
        })
    })
  })
})
