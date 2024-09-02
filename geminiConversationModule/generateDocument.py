def getDocument(dataList):
    sections = []
    current_section = []
    for line in dataList:
        if not line.strip():
            sections.append(current_section)
            current_section = []
        else:
            current_section.append(line)
    sections.append(current_section)
    class Document:
        def __init__(self, page_content):
            self.page_content = page_content
            self.metadata = {}
    documents = [Document(section_content) for section_content in sections]
    return documents