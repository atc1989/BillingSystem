import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailySalesDialog } from "@/components/daily-sales/DailySalesDialog";
import {
  encoderDiscountOptions,
  fieldClassName,
  getPaymentTypeOptions,
  primaryPaymentModes,
  secondaryPaymentModes,
  textareaClassName,
} from "@/components/daily-sales/shared";
import {
  dailySalesDiscountMatrix,
  encoderPackageOptions,
  getDailySalesPackageBlisterCount,
  getDailySalesPackageBottleCount,
  getDailySalesPackageConfig,
  getDailySalesPackagePrice,
  hasBundledPackageBlisters,
} from "@/lib/dailySalesPackages";
import { saveDailySalesEntry } from "@/services/dailySales.service";
import type {
  EncoderBlisterOption,
  EncoderFormModel,
  EncoderMemberTypeOption,
  EncoderPackageTypeOption,
  EncoderPaymentModeOption,
} from "@/types/dailySales";

type ManualOverrideKey =
  | "oneTimeDiscount"
  | "price"
  | "sales"
  | "released"
  | "releasedBlpk"
  | "toFollow"
  | "toFollowBlpk"
  | "salesTwo";

type ManualOverrides = Record<ManualOverrideKey, boolean>;

type NumericField =
  | "quantity"
  | "discount"
  | "price"
  | "oneTimeDiscount"
  | "sales"
  | "released"
  | "releasedBlpk"
  | "toFollow"
  | "toFollowBlpk"
  | "salesTwo";

const today = new Date().toISOString().slice(0, 10);

const initialManualOverrides: ManualOverrides = {
  oneTimeDiscount: false,
  price: false,
  sales: false,
  released: false,
  releasedBlpk: false,
  toFollow: false,
  toFollowBlpk: false,
  salesTwo: false,
};

function applyMemberPackageRules(
  current: EncoderFormModel,
  memberType: EncoderMemberTypeOption,
  packageType: EncoderPackageTypeOption,
): EncoderFormModel {
  const packageConfig = getDailySalesPackageConfig(packageType);

  return {
    ...current,
    memberType,
    packageType,
    originalPrice: packageConfig.originalPrice,
    discount: dailySalesDiscountMatrix[memberType][packageType],
    isToBlister: packageConfig.defaultIsToBlister,
  };
}

function buildInitialForm(): EncoderFormModel {
  const base: EncoderFormModel = {
    event: "DAVAO",
    date: today,
    pofNumber: "",
    name: "",
    username: "",
    newMember: "1",
    memberType: "DISTRIBUTOR",
    packageType: "SILVER",
    isToBlister: getDailySalesPackageConfig("SILVER").defaultIsToBlister,
    originalPrice: getDailySalesPackagePrice("SILVER"),
    quantity: 1,
    blisterCount: 0,
    discount: 0,
    price: getDailySalesPackagePrice("SILVER"),
    oneTimeDiscount: 0,
    noOfBottles: 1,
    sales: getDailySalesPackagePrice("SILVER"),
    paymentMode: "CASH",
    paymentType: "N/A",
    referenceNo: "N/A",
    paymentModeTwo: "N/A",
    paymentTypeTwo: "N/A",
    referenceNoTwo: "N/A",
    salesTwo: 0,
    released: 1,
    releasedBlpk: 0,
    toFollow: 0,
    toFollowBlpk: 0,
    remarks: "",
    receivedBy: "Hanna Jean Fernandez",
    collectedBy: "Jake Roldan Laurente",
  };

  return applyMemberPackageRules(base, base.memberType, base.packageType);
}

function applyComputedFields(input: EncoderFormModel, manualOverrides: ManualOverrides): EncoderFormModel {
  const quantity = Math.max(input.quantity, 0);
  const discount = Math.max(input.discount, 0);
  const oneTimeDiscount = manualOverrides.oneTimeDiscount
    ? input.oneTimeDiscount
    : Math.max(input.oneTimeDiscount, 0);
  const price = manualOverrides.price ? input.price : Math.max(input.originalPrice - discount, 0);
  const blisterCount = getDailySalesPackageBlisterCount(
    input.packageType,
    quantity,
    input.isToBlister,
  );
  const noOfBottles = getDailySalesPackageBottleCount(input.packageType, quantity);
  const sales = manualOverrides.sales ? input.sales : Math.max(price * quantity - oneTimeDiscount, 0);
  const normalizedSalesTwo = manualOverrides.salesTwo
    ? input.salesTwo
    : input.paymentMode === "EPOINTS"
    ? sales
    : Math.min(Math.max(input.salesTwo, 0), sales);

  return {
    ...input,
    quantity,
    discount,
    oneTimeDiscount,
    blisterCount,
    noOfBottles,
    price,
    sales,
    salesTwo: normalizedSalesTwo,
  };
}

export function EncoderTab({ onSaved }: { onSaved: () => void }) {
  const [form, setForm] = useState<EncoderFormModel>(() =>
    applyComputedFields(buildInitialForm(), initialManualOverrides),
  );
  const [manualOverrides, setManualOverrides] = useState<ManualOverrides>(initialManualOverrides);
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [savedMessage, setSavedMessage] = useState("Daily sales entry saved successfully.");
  const [paymentModeTwoError, setPaymentModeTwoError] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isBundledPackage = hasBundledPackageBlisters(form.packageType);

  const primaryPaymentTypeOptions = useMemo(
    () => getPaymentTypeOptions(form.paymentMode),
    [form.paymentMode],
  );
  const secondaryPaymentTypeOptions = useMemo(
    () => getPaymentTypeOptions(form.paymentModeTwo),
    [form.paymentModeTwo],
  );
  const primaryTypeIsReadOnly =
    primaryPaymentTypeOptions.length === 1 && primaryPaymentTypeOptions[0].value === "N/A";
  const secondaryTypeIsReadOnly =
    secondaryPaymentTypeOptions.length === 1 && secondaryPaymentTypeOptions[0].value === "N/A";

  const resetForm = () => {
    setForm(applyComputedFields(buildInitialForm(), initialManualOverrides));
    setManualOverrides(initialManualOverrides);
    setPaymentModeTwoError("");
  };

  const updateField = <K extends keyof EncoderFormModel>(key: K, value: EncoderFormModel[K]) => {
    setForm((prev) => applyComputedFields({ ...prev, [key]: value }, manualOverrides));
  };

  const updateNumericField = (key: NumericField, value: string, manualKey?: ManualOverrideKey) => {
    const parsed = Number(value || 0);
    const numericValue = Number.isFinite(parsed) ? parsed : 0;
    const nextOverrides = manualKey ? { ...manualOverrides, [manualKey]: true } : manualOverrides;

    if (manualKey) {
      setManualOverrides(nextOverrides);
    }

    setForm((prev) => applyComputedFields({ ...prev, [key]: numericValue }, nextOverrides));
  };

  const onPaymentModeChange = (value: Exclude<EncoderPaymentModeOption, "N/A">) => {
    setForm((prev) => {
      const nextOptions = getPaymentTypeOptions(value);
      const nextPaymentType = nextOptions[0]?.value ?? "N/A";
      const nextReferenceNo = nextPaymentType === "N/A" ? "N/A" : "";
      const nextSalesTwo = manualOverrides.salesTwo ? prev.salesTwo : value === "EPOINTS" ? prev.sales : prev.salesTwo;

      if (prev.paymentModeTwo !== "N/A" && prev.paymentModeTwo === value) {
        setPaymentModeTwoError("Secondary payment mode cannot match primary mode.");
        return applyComputedFields(
          {
            ...prev,
            paymentMode: value,
            paymentType: nextPaymentType,
            referenceNo: nextReferenceNo,
            salesTwo: nextSalesTwo,
            paymentModeTwo: "N/A",
            paymentTypeTwo: "N/A",
            referenceNoTwo: "N/A",
          },
          manualOverrides,
        );
      }

      setPaymentModeTwoError("");
      return applyComputedFields(
        {
          ...prev,
          paymentMode: value,
          paymentType: nextPaymentType,
          referenceNo: nextReferenceNo,
          salesTwo: nextSalesTwo,
        },
        manualOverrides,
      );
    });
  };

  const onPaymentModeTwoChange = (value: EncoderPaymentModeOption) => {
    if (value !== "N/A" && value === form.paymentMode) {
      setPaymentModeTwoError("Secondary payment mode cannot match primary mode.");
      setForm((prev) =>
        applyComputedFields(
          {
            ...prev,
            paymentModeTwo: "N/A",
            paymentTypeTwo: "N/A",
            referenceNoTwo: "N/A",
          },
          manualOverrides,
        ),
      );
      return;
    }

    setPaymentModeTwoError("");
    const nextOptions = getPaymentTypeOptions(value);
    const nextPaymentType = nextOptions[0]?.value ?? "N/A";
    const nextReferenceNo = nextPaymentType === "N/A" ? "N/A" : "";

    setForm((prev) =>
      applyComputedFields(
        {
          ...prev,
          paymentModeTwo: value,
          paymentTypeTwo: nextPaymentType,
          referenceNoTwo: nextReferenceNo,
        },
        manualOverrides,
      ),
    );
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    try {
      const result = await saveDailySalesEntry(form);
      setSavedMessage(
        result.source === "remote"
          ? "Daily sales entry saved successfully."
          : "Daily sales entry saved locally. Backend wiring for this dataset still needs setup.",
      );
      setIsSavedOpen(true);
      resetForm();
      onSaved();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to save daily sales entry.");
    }
  };

  return (
    <>
      <section className="mt-4">
        <Card className="gap-0 border-slate-200 shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg font-semibold text-slate-900">Encoder</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {submitError ? <p className="mb-3 text-sm text-red-600">{submitError}</p> : null}
            <form className="space-y-6" onSubmit={onSubmit} onReset={(event) => {
              event.preventDefault();
              resetForm();
            }}>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="text-sm font-medium text-slate-700">Event<input value={form.event} onChange={(event) => updateField("event", event.target.value)} className={fieldClassName} /></label>
                <label className="text-sm font-medium text-slate-700">Date<input type="date" value={form.date} onChange={(event) => updateField("date", event.target.value)} className={fieldClassName} /></label>
                <label className="text-sm font-medium text-slate-700">POF Number<input value={form.pofNumber} onChange={(event) => updateField("pofNumber", event.target.value)} className={fieldClassName} /></label>
                <label className="text-sm font-medium text-slate-700">Member Name<input value={form.name} onChange={(event) => updateField("name", event.target.value)} className={fieldClassName} /></label>
                <label className="text-sm font-medium text-slate-700">Username<input value={form.username} onChange={(event) => updateField("username", event.target.value)} className={fieldClassName} /></label>
                <label className="text-sm font-medium text-slate-700">New Member?
                  <select value={form.newMember} onChange={(event) => updateField("newMember", event.target.value as "1" | "0")} className={fieldClassName}>
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="text-sm font-medium text-slate-700">Member Type
                  <select value={form.memberType} onChange={(event) => setForm((prev) => applyComputedFields(applyMemberPackageRules(prev, event.target.value as EncoderMemberTypeOption, prev.packageType), manualOverrides))} className={fieldClassName}>
                    <option value="DISTRIBUTOR">Distributor</option>
                    <option value="STOCKIST">Mobile Stockist</option>
                    <option value="CENTER">Center</option>
                    <option value="NON-MEMBER">Non-member</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">Package Type
                  <select value={form.packageType} onChange={(event) => setForm((prev) => applyComputedFields(applyMemberPackageRules(prev, prev.memberType, event.target.value as EncoderPackageTypeOption), manualOverrides))} className={fieldClassName}>
                    {encoderPackageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">To Blister?
                  <select value={form.isToBlister} onChange={(event) => updateField("isToBlister", event.target.value as EncoderBlisterOption)} disabled={isBundledPackage} className={fieldClassName}>
                    <option value="0">No</option>
                    <option value="1">Yes</option>
                  </select>
                  {isBundledPackage ? <span className="mt-1 block text-xs text-slate-500">Package bundles already include blister counts.</span> : null}
                </label>
                <label className="text-sm font-medium text-slate-700">Original Price<input type="number" readOnly value={form.originalPrice} className={`${fieldClassName} bg-slate-50`} /></label>
                <label className="text-sm font-medium text-slate-700">Quantity<input type="number" min="0" value={form.quantity} onChange={(event) => updateNumericField("quantity", event.target.value)} className={fieldClassName} /></label>
                <label className="text-sm font-medium text-slate-700">Blister Count<input type="number" readOnly value={form.blisterCount} className={`${fieldClassName} bg-slate-50`} /></label>
                <label className="text-sm font-medium text-slate-700">Discount
                  <select value={form.discount} onChange={(event) => updateNumericField("discount", event.target.value)} className={fieldClassName}>
                    {encoderDiscountOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">Price<input type="number" value={form.price} onChange={(event) => updateNumericField("price", event.target.value, "price")} className={`${fieldClassName} bg-slate-50`} /></label>
                <label className="text-sm font-medium text-slate-700">One-time Discount<input type="number" min="0" value={form.oneTimeDiscount} onChange={(event) => updateNumericField("oneTimeDiscount", event.target.value, "oneTimeDiscount")} className={fieldClassName} /></label>
                <label className="text-sm font-medium text-slate-700">Number of Bottles<input type="number" readOnly value={form.noOfBottles} className={`${fieldClassName} bg-slate-50`} /></label>
                <label className="text-sm font-medium text-slate-700">Total Sales<input type="number" value={form.sales} onChange={(event) => updateNumericField("sales", event.target.value, "sales")} className={`${fieldClassName} bg-slate-50`} /></label>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <label className="text-sm font-medium text-slate-700">Mode of Payment
                  <select value={form.paymentMode} onChange={(event) => onPaymentModeChange(event.target.value as Exclude<EncoderPaymentModeOption, "N/A">)} className={fieldClassName}>
                    {primaryPaymentModes.map((mode) => <option key={mode} value={mode}>{mode === "AR(LEADERSUPPORT)" ? "AR (LEADER SUPPORT)" : mode}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">Payment Mode Type
                  <select value={form.paymentType} onChange={(event) => updateField("paymentType", event.target.value)} disabled={primaryTypeIsReadOnly} className={`${fieldClassName} disabled:bg-slate-50 disabled:text-slate-500`}>
                    {primaryPaymentTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">Reference Number<input value={form.referenceNo} readOnly={primaryTypeIsReadOnly} onChange={(event) => updateField("referenceNo", event.target.value)} className={`${fieldClassName} ${primaryTypeIsReadOnly ? "bg-slate-50 text-slate-500" : ""}`} /></label>
                <div />
                <label className="text-sm font-medium text-slate-700">Mode of Payment (2)
                  <select value={form.paymentModeTwo} onChange={(event) => onPaymentModeTwoChange(event.target.value as EncoderPaymentModeOption)} className={fieldClassName}>
                    {secondaryPaymentModes.map((mode) => <option key={mode} value={mode}>{mode === "AR(LEADERSUPPORT)" ? "AR (LEADER SUPPORT)" : mode}</option>)}
                  </select>
                  {paymentModeTwoError ? <span className="mt-1 block text-xs text-red-600">{paymentModeTwoError}</span> : null}
                </label>
                <label className="text-sm font-medium text-slate-700">Payment Mode Type (2)
                  <select value={form.paymentTypeTwo} onChange={(event) => updateField("paymentTypeTwo", event.target.value)} disabled={secondaryTypeIsReadOnly} className={`${fieldClassName} disabled:bg-slate-50 disabled:text-slate-500`}>
                    {secondaryPaymentTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">Reference Number (2)<input value={form.referenceNoTwo} readOnly={secondaryTypeIsReadOnly} onChange={(event) => updateField("referenceNoTwo", event.target.value)} className={`${fieldClassName} ${secondaryTypeIsReadOnly ? "bg-slate-50 text-slate-500" : ""}`} /></label>
                <label className="text-sm font-medium text-slate-700">Amount (2)<input type="number" min="0" value={form.salesTwo} onChange={(event) => updateNumericField("salesTwo", event.target.value, "salesTwo")} className={fieldClassName} /></label>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <label className="text-sm font-medium text-slate-700">Released (Bottle)<input type="number" min="0" value={form.released} onChange={(event) => updateNumericField("released", event.target.value, "released")} className={fieldClassName} /></label>
                <label className="text-sm font-medium text-slate-700">Released (Blister)<input type="number" min="0" value={form.releasedBlpk} onChange={(event) => updateNumericField("releasedBlpk", event.target.value, "releasedBlpk")} className={fieldClassName} /></label>
                <label className="text-sm font-medium text-slate-700">To Follow (Bottle)<input type="number" min="0" value={form.toFollow} onChange={(event) => updateNumericField("toFollow", event.target.value, "toFollow")} className={fieldClassName} /></label>
                <label className="text-sm font-medium text-slate-700">To Follow (Blister)<input type="number" min="0" value={form.toFollowBlpk} onChange={(event) => updateNumericField("toFollowBlpk", event.target.value, "toFollowBlpk")} className={fieldClassName} /></label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700 md:col-span-2">Remarks<textarea value={form.remarks} onChange={(event) => updateField("remarks", event.target.value)} className={textareaClassName} rows={3} /></label>
                <label className="text-sm font-medium text-slate-700">Received By<input value={form.receivedBy} onChange={(event) => updateField("receivedBy", event.target.value)} className={fieldClassName} /></label>
                <label className="text-sm font-medium text-slate-700">Collected By<input value={form.collectedBy} onChange={(event) => updateField("collectedBy", event.target.value)} className={fieldClassName} /></label>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button type="reset" variant="secondary">Clear Form</Button>
                <Button type="submit">Save Entry</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      <DailySalesDialog isOpen={isSavedOpen} title="Saved" onClose={() => setIsSavedOpen(false)}>
        {savedMessage}
      </DailySalesDialog>
    </>
  );
}

