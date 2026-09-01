"""Repair core ERPNext fields and conditionally enable the HRMS integration."""

import frappe

from batch_projects.setup.integration_fields import ensure_integration_custom_fields


def execute():
    ensure_integration_custom_fields()
    frappe.db.commit()
