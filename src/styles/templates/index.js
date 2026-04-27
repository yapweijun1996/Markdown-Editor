import { defaultTemplate } from './default.js'
import { businessReportTemplate } from './businessReport.js'
import { technicalDocumentTemplate } from './technicalDocument.js'
import { minimalTemplate } from './minimal.js'

export const TEMPLATES = {
  default: defaultTemplate,
  businessReport: businessReportTemplate,
  technicalDocument: technicalDocumentTemplate,
  minimal: minimalTemplate,
}

export const TEMPLATE_LIST = [
  defaultTemplate,
  businessReportTemplate,
  technicalDocumentTemplate,
  minimalTemplate,
]

export function getTemplate(id) {
  return TEMPLATES[id] || defaultTemplate
}
