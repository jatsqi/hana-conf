sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/json/JSONModel",
        "sap/ui/core/ComponentSupport",
    ],
    (Controller, JSONModel) => {
        return Controller.extend("recap.App", {
            onInit() {
                const oModel = new JSONModel({
                    cfp: `&rarr; <a href="https://recap.cfapps.eu12.hana.ondemand.com">CfP (open</a> until Mar 31)`,
                    where: `<p>Our friends from <a href="https://openui5.org/ui5con/germany2023/">UI5con</a> rock their event the previous day, Jul 6.</p><p>So you &#x1FAF5; can get the full stack conference experience, back to back.</p>`,
                })
                this.getView().setModel(oModel)
            },
        })
    }
)
