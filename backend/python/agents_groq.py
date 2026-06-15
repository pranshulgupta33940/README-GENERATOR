from langgraph.graph import StateGraph
from langchain_core.messages import HumanMessage
from tools import get_file_tree, read_file, set_repo_path
from prompts import select_files_prompt, summarize_prompt, generate_readme_prompt
from dotenv import load_dotenv
from typing import TypedDict, List
import os
import re
import json
import sys
import time

# Load .env variables
load_dotenv()
def log(message: str):
    print(message)
    sys.stdout.flush()

# ✅ Import fallback LLM manager
from llm_fallback import LLMFallbackManager

# Initialize fallback-based LLM
try:
    llm = LLMFallbackManager()
    log("✅ Groq LLM initialized successfully")
except Exception as e:
    # If Groq initialization fails, log the error and stop execution.
    log(f"❌ Groq LLM failed to initialize: {str(e)}")
    raise

# Graph state structure
class GraphState(TypedDict):
    selected_files: List[str]
    summaries: List[str]
    readme: str

# Step 1: Balanced file selection (speed + accuracy)
def agent_select_files(state):
    file_tree = get_file_tree()
    
    # Balanced settings for speed + accuracy
    max_files_to_show = int(os.getenv('MAX_FILES_TO_SHOW', '75'))  # Show more files to LLM
    max_files_to_process = int(os.getenv('MAX_FILES_TO_PROCESS', '15'))  # Process more files for accuracy
    
    # Pre-filter: Remove obviously unimportant files for speed
    filtered_tree = []
    for file_path in file_tree:
        file_lower = file_path.lower()
        # Skip files that are usually not important for README
        if not any(skip in file_lower for skip in [
            '.git/', 'node_modules/', '__pycache__/', '.venv/', 'venv/',
            '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
            '.min.js', '.min.css', 'dist/', 'build/', '.cache/'
        ]):
            filtered_tree.append(file_path)
    
    # Show more files for better selection
    display_tree = filtered_tree[:max_files_to_show]
    
    log(f"⚡ Balanced selection: {len(file_tree)} → {len(filtered_tree)} → {len(display_tree)} files")
    
    # Use existing prompt
    prompt = select_files_prompt.format(file_tree="\n".join(display_tree))
    messages = [{"role": "user", "content": prompt}]
    
    # Increased token limit for better selection accuracy
    raw = llm.make_request(messages, max_tokens=800)
    raw = raw.strip()

    # Parse selected files
    try:
        match = re.search(r'\[(.*?)\]', raw, re.DOTALL)
        if match:
            json_like = f"[{match.group(1)}]"
            selected_files = json.loads(json_like)
        else:
            selected_files = [line.strip().strip('"').strip(',') for line in raw.splitlines() if line.strip()]
    except Exception as e:
        log(f"⚠️ Parsing failed, using fallback selection: {str(e)}")
        # Smarter fallback for better accuracy
        important_files = []
        for file_path in display_tree:
            if any(pattern in file_path.lower() for pattern in [
                'main', 'index', 'app', 'server', 'config', 'package', 'requirements',
                'setup', 'dockerfile', 'readme', '.env', 'route'
            ]):
                important_files.append(file_path)
        selected_files = important_files[:max_files_to_process] if important_files else display_tree[:max_files_to_process]

    # Balanced final selection
    final_selection = selected_files[:max_files_to_process]
    log(f"✅ Selected {len(final_selection)} files for detailed processing")
    return {"selected_files": final_selection}

# Step 2: Detailed bulk processing with accuracy focus
def agent_summarize_files(state):
    selected_files = state["selected_files"]
    summaries = []
    
    # Balanced settings: moderate speed, high accuracy
    files_per_request = int(os.getenv('FILES_PER_REQUEST', '4'))  # Fewer files per call for better context
    max_content_per_file = int(os.getenv('MAX_CONTENT_PER_FILE', '2500'))  # More content for accuracy
    
    log(f"🎯 Detailed bulk processing: {len(selected_files)} files, {files_per_request} per request")
    
    # Process in smaller batches for better accuracy
    for i in range(0, len(selected_files), files_per_request):
        batch = selected_files[i:i + files_per_request]
        batch_num = (i // files_per_request) + 1
        total_batches = (len(selected_files) + files_per_request - 1) // files_per_request
        
        log(f"🔍 Detailed batch {batch_num}/{total_batches}: {len(batch)} files")
        
        # Prepare detailed content for each file
        detailed_files = []
        for filename in batch:
            try:
                content = read_file(filename)
                if content.strip():
                    # Keep more content for better understanding
                    truncated = content[:max_content_per_file]
                    # Add file context for better processing
                    file_info = f"""
=== FILE: {filename} ===
File Path: {filename}
Content Length: {len(content)} characters
Content:
{truncated}
{'... (truncated)' if len(content) > max_content_per_file else ''}
"""
                    detailed_files.append(file_info)
                else:
                    detailed_files.append(f"=== FILE: {filename} ===\n(Empty file)")
            except Exception as e:
                detailed_files.append(f"=== FILE: {filename} ===\n(Error reading: {str(e)})")
        
        # Enhanced bulk prompt with detailed instructions
        bulk_prompt = f"""You are analyzing {len(batch)} files from a software project. For each file, provide a comprehensive summary that includes:

1. **Purpose**: What this file does and its role in the project
2. **Key Components**: Important functions, classes, components, or configurations
3. **Dependencies**: Notable imports, libraries, or frameworks used
4. **Functionality**: Core logic, API endpoints, data models, or business rules
5. **Integration**: How it connects to other parts of the application

Be detailed and technical. Focus on understanding the project architecture and functionality.

{chr(10).join(detailed_files)}

For each file, format your response as:
### {filename}
**Purpose:** [What this file does]
**Key Components:** [Important functions/classes/components]
**Dependencies:** [Notable imports/libraries]
**Functionality:** [Core logic and features]
**Integration:** [How it fits in the project]

Provide comprehensive summaries for each file:"""
        log(f"📖 Reading file: {filename}")
        
        try:
            messages = [{"role": "user", "content": bulk_prompt}]
            # Increased token limit for detailed summaries
            bulk_response = llm.make_request(messages, max_tokens=2500)
            
            if bulk_response.strip():
                summaries.append(bulk_response)
                log(f"✅ Generated detailed summaries for {len(batch)} files")
            else:
                # Better fallback using individual processing
                log(f"⚠️ Bulk failed, falling back to individual processing for batch {batch_num}")
                for filename in batch:
                    try:
                        content = read_file(filename)[:2000]  # Reasonable content size
                        if content.strip():
                            individual_prompt = summarize_prompt.format(filename=filename, content=content)
                            individual_response = llm.make_request([{"role": "user", "content": individual_prompt}], max_tokens=800)
                            summaries.append(f"### {filename}\n{individual_response}")
                        else:
                            summaries.append(f"### {filename}\n(Empty file)")
                    except Exception as e:
                        summaries.append(f"### {filename}\n(Processing failed: {str(e)})")
                    
        except Exception as e:
            log(f"⚠️ Batch {batch_num} failed, using individual fallback: {e}")
            # Individual processing fallback for accuracy
            for filename in batch:
                try:
                    content = read_file(filename)[:2000]
                    if content.strip():
                        individual_prompt = summarize_prompt.format(filename=filename, content=content)
                        individual_response = llm.make_request([{"role": "user", "content": individual_prompt}], max_tokens=800)
                        summaries.append(f"### {filename}\n{individual_response}")
                    else:
                        summaries.append(f"### {filename}\n(Empty file)")
                except Exception as e:
                    summaries.append(f"### {filename}\n(Failed to process)")
    
    log(f"✅ Detailed processing complete: {total_batches} API calls with enhanced accuracy")
    return {"summaries": summaries}

# Step 3: Enhanced README generation with more detail
def agent_generate_readme(state):
    summaries = state["summaries"]

    # Allow more summaries for comprehensive README
    max_summaries = int(os.getenv('MAX_SUMMARIES_FOR_README', '25'))
    limited_summaries = summaries[:max_summaries]
    log("📝 Generating summary…")
    log("📄 Generating README.md…")

    joined = "\n\n".join(limited_summaries)

    # Enhanced instruction for more detailed README
    enhanced_instruction = """
IMPORTANT: Create a comprehensive and detailed README that provides developers with a complete understanding of the project. Include specific technical details, proper setup instructions, and thorough feature descriptions. Make it professional and informative while being well-structured and visually appealing.
"""

    # Use existing prompt with enhancement
    prompt = generate_readme_prompt.format(summaries=joined) + enhanced_instruction
    
    try:
        # Try with normal token limit first
        response = llm.make_request([{"role": "user", "content": prompt}], max_tokens=4500)
        return {"readme": response}
    except Exception as e:
        log(f"⚠️ High-quality generation failed: {str(e)}")
        log("🔄 Attempting fallback generation with reduced requirements...")
        
        # Fallback: Shorter prompt, fewer tokens
        fallback_prompt = f"""
Generate a professional README.md for this project based on the file summaries:

{joined[:3000]}  

Include: project title, description, features, tech stack, installation, and usage.
Keep it concise but informative.
"""
        
        try:
            response = llm.make_request([{"role": "user", "content": fallback_prompt}], max_tokens=2000)
            log("✅ Fallback generation successful")
            return {"readme": response}
        except Exception as fallback_error:
            log(f"❌ Fallback generation also failed: {str(fallback_error)}")
            
            # Last resort: Basic template
            basic_readme = f"""# Project README

## Description
This project contains the following components:

{chr(10).join([f"- {summary.split(chr(10))[0]}" for summary in limited_summaries[:5]])}

## Installation
1. Clone this repository
2. Install dependencies
3. Run the application

## Usage
Please refer to the source code and documentation for usage instructions.

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

---
*This README was generated automatically when API limits were reached.*
"""
            log("⚠️ Using basic template README due to API failures")
            return {"readme": basic_readme}


# Build LangGraph graph
def run_agent(repo_path):
    try:
        set_repo_path(repo_path)
        log("📥 Repository received")
        log("⚙️ Initializing README generation process")

        # Test LLM connection first
        try:
            test_response = llm.make_request([{"role": "user", "content": "Hello, please respond with 'OK'"}], max_tokens=10)
            log(f"✅ LLM connection test successful: {test_response[:20]}")
        except Exception as e:
            log(f"❌ LLM connection failed: {str(e)}")
            raise Exception("LLM connection failed")

        builder = StateGraph(GraphState)
        builder.add_node("select_files", agent_select_files)
        builder.add_node("summarize", agent_summarize_files)
        builder.add_node("generate_readme", agent_generate_readme)

        builder.set_entry_point("select_files")
        builder.add_edge("select_files", "summarize")
        builder.add_edge("summarize", "generate_readme")
        builder.set_finish_point("generate_readme")

        log("🚀 Starting graph execution...")
        graph = builder.compile()
        output = graph.invoke({})
        
        if not output or "readme" not in output:
            log("❌ Graph execution failed - no output generated")
            raise Exception("Graph execution failed")
            
        readme = output["readme"]
        if not readme or len(readme.strip()) == 0:
            log("❌ Generated README is empty")
            raise Exception("Generated README is empty")
            
        log(f"✅ README generated successfully: {len(readme)} characters")
        write_readme_to_file(readme, root_dir=repo_path)
        return readme
        
    except Exception as e:
        log(f"❌ Fatal error in run_agent: {str(e)}")
        import traceback
        log(f"❌ Traceback: {traceback.format_exc()}")
        raise e


# Save README to file
def write_readme_to_file(content, root_dir="temp"):
    # Ensure the directory exists
    os.makedirs(root_dir, exist_ok=True)
    path = os.path.join(root_dir, "readme.md")
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    log(f"✅ readme.md written to {path}")

# Local test
if __name__ == "__main__":
    repo_path = sys.argv[1]
    result = run_agent(repo_path)
    # print(result) # Removed to prevent printing the whole README into the terminal logs
